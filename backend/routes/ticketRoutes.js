const express = require('express');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const sequelize = require('../config/db');
const Ticket = require('../models/Ticket');
const TicketComment = require('../models/TicketComment');
const TicketAttachment = require('../models/TicketAttachment');
const TicketHistory = require('../models/TicketHistory');
const TicketShare = require('../models/TicketShare');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { sendWhatsApp } = require('../utils/notification');

const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ── Unread Ticket Count (for sidebar badge) ──
router.get('/unread-count', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        // Count unread notifications of type TICKET for this user
        const unreadCount = await Notification.count({
            where: {
                userId,
                type: 'TICKET',
                isRead: false
            }
        });
        res.json({ total: unreadCount });
    } catch (err) {
        res.json({ total: 0 });
    }
});

// ── Create Ticket ──
router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        const { title, description, priority, assigneeId } = req.body;
        const maxId = (await Ticket.max('id')) || 0;
        let nextNum = maxId + 1;
        let ticketId = `TICKET-${1000 + nextNum}`;
        while (await Ticket.findOne({ where: { ticketId } })) {
            nextNum++;
            ticketId = `TICKET-${1000 + nextNum}`;
        }
        
        const ticket = await Ticket.create({
            ticketId,
            title,
            description,
            priority,
            creatorId: req.user.id,
            currentAssigneeId: assigneeId || req.user.id
        });

        let assigneeName = req.user.name;
        if (assigneeId && String(assigneeId) !== String(req.user.id)) {
            const assignee = await User.findByPk(assigneeId);
            if (assignee) assigneeName = assignee.fullName;
        }

        await TicketHistory.create({
            ticketId: ticket.id,
            action: 'Ticket Raised',
            details: `Created by ${req.user.name} and assigned to ${assigneeName}`,
            userId: req.user.id
        });
        
        if (req.file) {
            await TicketAttachment.create({
                ticketId: ticket.id,
                userId: req.user.id,
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`,
                fileType: req.file.mimetype
            });
            await TicketHistory.create({
                ticketId: ticket.id,
                action: 'Attachment Added',
                details: `Attached file: ${req.file.originalname}`,
                userId: req.user.id
            });
        }

        // ── WhatsApp Notification to Assignee ──
        if (assigneeId) {
            const assignee = await User.findByPk(assigneeId);
            if (assignee && (assignee.whatsappNumber || assignee.phone)) {
                const msg = `Hi ${assignee.fullName}, a new ticket [${ticketId}] has been assigned to you: "${title}". Check your dashboard.`;
                await sendWhatsApp(assignee.whatsappNumber || assignee.phone, msg);
            }
            
            // Send App Notification
            if (String(assigneeId) !== String(req.user.id)) {
                const notif = await Notification.create({
                    userId: assigneeId,
                    title: 'Ticket Assigned',
                    message: `New ticket assigned to you: [${ticketId}] ${title}`,
                    type: 'TICKET',
                    relatedId: ticket.id
                });
                req.app.get('io').to(String(assigneeId)).emit('new_notification', notif);
            }
        }

        // ── Real-time Socket Update ──
        req.app.get('io').emit('ticket_update', { ticketId: ticket.id, action: 'created' });

        res.status(201).json(ticket);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Get My Tickets (Strict Privacy unless ?all=true is passed) ──
router.get('/analytics/personal', protect, analyticsController.getPersonalAnalytics);
router.get('/my-tickets', protect, async (req, res) => {
    try {
        let whereClause = {};
        const isExecutive = ['IT Admin', 'Chairman', 'CEO'].includes(req.user.role);
        const showDeleted = req.query.deleted === 'true';
        const showAll = req.query.all === 'true';
        const { startDate, endDate } = req.query;

        // Security check
        if (showDeleted && !isExecutive) {
            return res.status(403).json({ error: 'Permission denied. Only IT Admin, Chairman, CEO can view deleted tickets.' });
        }
        if (showAll && !isExecutive) {
            return res.status(403).json({ error: 'Permission denied. Only executives can view all tickets.' });
        }
        
        // Base Privacy Check
        if (isExecutive && (showAll || showDeleted)) {
            whereClause = showDeleted ? { isDeleted: true } : { isDeleted: false };
            // If they want literally ALL including deleted, we could pass an extra flag, but normally 'all' means all active.
        } else {
            whereClause = {
                isDeleted: false,
                [Op.or]: [
                    { creatorId: req.user.id },
                    { currentAssigneeId: req.user.id },
                    { '$TicketShares.userId$': req.user.id }
                ]
            };
        }

        // Date Filtering with proper UTC handling
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            whereClause.createdAt = { [Op.between]: [start, end] };
        } else if (startDate) {
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0);
            whereClause.createdAt = { [Op.gte]: start };
        } else if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            whereClause.createdAt = { [Op.lte]: end };
        }

        const tickets = await Ticket.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'Creator', attributes: ['fullName', 'role'] },
                { model: User, as: 'Assignee', attributes: ['fullName', 'role'] },
                { model: TicketShare, required: false, include: [{ model: User, attributes: ['fullName'] }] }
            ],
            order: [
                ['createdAt', 'DESC']
            ],
            subQuery: false
        });
        
        res.json(tickets);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Get Ticket Detail with Authorization Check ──
router.get('/:id', protect, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id, {
            include: [
                { model: User, as: 'Creator', attributes: ['fullName', 'role'] },
                { model: User, as: 'Assignee', attributes: ['fullName', 'role'] },
                { model: TicketShare, include: [{ model: User, attributes: ['fullName', 'role'] }] },
                { model: TicketComment, include: [{ model: User, attributes: ['fullName', 'role'] }] },
                { model: TicketAttachment, include: [{ model: User, attributes: ['fullName'] }] },
                { model: TicketHistory, include: [{ model: User, attributes: ['fullName'] }] }
            ]
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        // Authorization Check
        const isAuthorized = 
            ['IT Admin', 'Chairman', 'CEO'].includes(req.user.role) ||
            ticket.creatorId === req.user.id ||
            ticket.currentAssigneeId === req.user.id ||
            ticket.TicketShares.some(s => s.userId === req.user.id);

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Access denied to this ticket' });
        }

        res.json(ticket);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Update Status (Working / Completed) ──
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body; // 'Working', 'Completed'
        const ticket = await Ticket.findByPk(req.params.id, {
            include: [{ model: TicketShare }]
        });
        
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        // Authorization Check for Update
        const canUpdate = 
            ['IT Admin', 'Chairman', 'CEO'].includes(req.user.role) ||
            ticket.currentAssigneeId === req.user.id;

        if (!canUpdate) {
            return res.status(403).json({ error: 'Only assignees or admins can update status' });
        }

        ticket.status = status;
        await ticket.save();

        await TicketHistory.create({
            ticketId: ticket.id,
            action: 'Status Updated',
            details: `Changed status to ${status}`,
            userId: req.user.id
        });

        // Notify Creator about status change
        if (ticket.creatorId !== req.user.id) {
            const notif = await Notification.create({
                userId: ticket.creatorId,
                title: 'Ticket Status Updated',
                message: `Ticket [${ticket.ticketId}] status changed to ${status}`,
                type: 'TICKET',
                relatedId: ticket.id
            });
            req.app.get('io').to(String(ticket.creatorId)).emit('new_notification', notif);
        }

        // ── Real-time Socket Update ──
        req.app.get('io').emit('ticket_update', { ticketId: ticket.id, action: 'status_updated' });

        res.json(ticket);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Transfer Ticket ──
router.put('/:id/transfer', protect, upload.array('files'), async (req, res) => {
    try {
        const { assigneeId, note } = req.body;
        const ticket = await Ticket.findByPk(req.params.id);
        const nextUser = await User.findByPk(assigneeId);
        
        const previousAssigneeId = ticket.currentAssigneeId;
        
        ticket.currentAssigneeId = assigneeId;
        ticket.status = 'Assigned';
        await ticket.save();
        
        // Handle attachments
        if (req.files && req.files.length > 0) {
            for (let f of req.files) {
                await TicketAttachment.create({
                    ticketId: ticket.id,
                    userId: req.user.id,
                    fileName: f.originalname,
                    fileUrl: `/uploads/${f.filename}`,
                    fileType: f.mimetype
                });
            }
        }

        // Keep a copy in the previous assignee's past ticket view by sharing it automatically
        if (previousAssigneeId && String(previousAssigneeId) !== String(assigneeId)) {
            await TicketShare.findOrCreate({
                where: { ticketId: ticket.id, userId: previousAssigneeId }
            });
        }

        await TicketHistory.create({
            ticketId: ticket.id,
            action: 'Ticket Transferred',
            details: `Transferred to ${nextUser.fullName}. Note: ${note || 'None'}`,
            userId: req.user.id
        });

        // ── WhatsApp Notification to New Assignee ──
        if (nextUser && (nextUser.whatsappNumber || nextUser.phone)) {
            const msg = `Hi ${nextUser.fullName}, ticket [${ticket.ticketId}] has been transferred to you by ${req.user.name}: "${ticket.title}".`;
            await sendWhatsApp(nextUser.whatsappNumber || nextUser.phone, msg);
        }

        // Send App Notification
        const notif = await Notification.create({
            userId: assigneeId,
            title: 'Ticket Assigned',
            message: `Ticket [${ticket.ticketId}] was transferred to you.`,
            type: 'TICKET',
            relatedId: ticket.id
        });

        // ── Real-time Socket Notification ──
        req.app.get('io').to(String(assigneeId)).emit('new_notification', notif);
        req.app.get('io').emit('ticket_update', { ticketId: ticket.id, action: 'transferred' });

        res.json(ticket);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Share Ticket (Add multiple assignees to the tracker) ──
router.post('/:id/share', protect, upload.array('files'), async (req, res) => {
    try {
        const userIds = typeof req.body.userIds === 'string' ? JSON.parse(req.body.userIds) : req.body.userIds;
        const ticket = await Ticket.findByPk(req.params.id);
        
        for (const uid of userIds) {
            await TicketShare.findOrCreate({
                where: { ticketId: ticket.id, userId: uid }
            });
            
            const u = await User.findByPk(uid);
            if(u) {
                await TicketHistory.create({
                    ticketId: ticket.id,
                    action: 'Ticket Shared',
                    details: `Shared with ${u.fullName}`,
                    userId: req.user.id
                });
                
                await Notification.create({
                    userId: uid,
                    title: 'Ticket Shared',
                    message: `Ticket [${ticket.ticketId}] has been shared with you by ${req.user.name}.`,
                    type: 'TICKET',
                    relatedId: ticket.id
                });
                
                if (u.whatsappNumber || u.phone) {
                    const msg = `Hi ${u.fullName}, you have been added as a watcher to ticket [${ticket.ticketId}] by ${req.user.name}.`;
                    await sendWhatsApp(u.whatsappNumber || u.phone, msg);
                }
            }
        }
        
        // Handle attachments
        if (req.files && req.files.length > 0) {
            for (let f of req.files) {
                await TicketAttachment.create({
                    ticketId: ticket.id,
                    userId: req.user.id,
                    fileName: f.originalname,
                    fileUrl: `/uploads/${f.filename}`,
                    fileType: f.mimetype
                });
            }
        }
        
        res.json({ message: 'Ticket shared successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Add Comment / Chat ──
router.post('/:id/comment', protect, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const comment = await TicketComment.create({
            ticketId: req.params.id,
            userId: req.user.id,
            comment: req.body.comment
        });

        // Notify other parties (if I'm creator, notify assignee; if I'm assignee, notify creator)
        let notifyTarget = null;
        if (req.user.id === ticket.creatorId) notifyTarget = ticket.currentAssigneeId;
        else if (req.user.id === ticket.currentAssigneeId) notifyTarget = ticket.creatorId;

        if (notifyTarget && notifyTarget !== req.user.id) {
            const notif = await Notification.create({
                userId: notifyTarget,
                title: 'New Ticket Comment',
                message: `New comment on [${ticket.ticketId}] from ${req.user.name}`,
                type: 'TICKET',
                relatedId: ticket.id
            });
            req.app.get('io').to(String(notifyTarget)).emit('new_notification', notif);
        }

        // ── Real-time Socket Update ──
        req.app.get('io').emit('ticket_update', { ticketId: ticket.id, action: 'comment_added' });

        res.status(201).json(comment);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Upload Attachment ──
router.post('/:id/attachment', protect, upload.single('file'), async (req, res) => {
    try {
        const attachment = await TicketAttachment.create({
            ticketId: req.params.id,
            userId: req.user.id,
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype
        });
        res.status(201).json(attachment);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Delete Ticket ──
router.delete('/:id', protect, async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        // Authorization: Only the Creator or IT Admin can delete
        const canDelete = ticket.creatorId === req.user.id || req.user.role === 'IT Admin';
        if (!canDelete) return res.status(403).json({ error: 'Permission denied. Only the person who created this ticket or IT Admin can delete it.' });

        ticket.isDeleted = true;
        await ticket.save();

        await TicketHistory.create({
            ticketId: ticket.id,
            action: 'Ticket Soft-Deleted',
            details: `Deleted by ${req.user.name} (${req.user.role})`,
            userId: req.user.id
        });

        req.app.get('io').emit('ticket_update', { ticketId: req.params.id, action: 'deleted' });
        res.json({ message: 'Ticket soft-deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Restore Ticket (IT Admin only) ──
router.put('/:id/restore', protect, async (req, res) => {
    try {
        if (req.user.role !== 'IT Admin') {
            return res.status(403).json({ error: 'Only IT Admin can restore deleted tickets.' });
        }
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        ticket.isDeleted = false;
        await ticket.save();

        await TicketHistory.create({
            ticketId: ticket.id,
            action: 'Ticket Restored',
            details: `Restored by ${req.user.name}`,
            userId: req.user.id
        });

        req.app.get('io').emit('ticket_update', { ticketId: req.params.id, action: 'restored' });
        res.json({ message: 'Ticket restored successfully', ticket });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
