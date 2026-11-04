const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get ONLY My Notifications (Personal to each user)
router.get('/', protect, async (req, res) => {
    try {
        // Everyone sees ONLY their own notifications - no global system activity
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        return res.json(notifications);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DEPRECATED - Kept for backward compatibility
router.get('/all', protect, async (req, res) => {
    try {
        const isExec = ['Chairman', 'CEO', 'IT Admin'].includes(req.user.role);
        
        // 1. Get standard notifications
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 30
        });

        // 2. For Executives, also fetch recent Ticket History as "System Intelligence"
        if (isExec) {
            const TicketHistory = require('../models/TicketHistory');
            const Ticket = require('../models/Ticket');
            const User = require('../models/User');

            const history = await TicketHistory.findAll({
                include: [
                    {
                        model: Ticket,
                        attributes: ['ticketId', 'title', 'creatorId', 'currentAssigneeId'],
                        where: {
                            [require('sequelize').Op.or]: [
                                { creatorId: req.user.id },
                                { currentAssigneeId: req.user.id }
                            ]
                        }
                    },
                    { model: User, attributes: ['fullName', 'role'] }
                ],
                order: [['createdAt', 'DESC']],
                limit: 20
            });

            // Map history to notification-like format
            const historyNotifs = history.map(h => ({
                id: `h-${h.id}`,
                title: h.action,
                message: `${h.Ticket?.ticketId || 'Ticket'}: ${h.details} (by ${h.User?.fullName || 'System'})`,
                type: 'TICKET',
                relatedId: h.ticketId,
                isRead: true,
                createdAt: h.createdAt,
                isHistory: true
            }));

            // Merge and sort
            const combined = [...notifications, ...historyNotifs].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            ).slice(0, 50);

            return res.json(combined);
        }

        res.json(notifications);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark as Read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notif = await Notification.findByPk(req.params.id);
        if (notif && notif.userId === req.user.id) {
            notif.isRead = true;
            await notif.save();
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark all as read
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.update({ isRead: true }, { where: { userId: req.user.id } });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
