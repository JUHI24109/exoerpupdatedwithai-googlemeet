const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { Op }  = require('sequelize');
const Message = require('../models/Message');
const Group   = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// File Upload Config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ── Get History ──
router.get('/history/:u1/:u2', protect, async (req, res) => {
  try {
    const { u1, u2 } = req.params;
    
    if (String(u2).startsWith('group-') || (u2.length > 30)) { // Static or UUID groups
      // Privacy check for dynamic groups
      if (!String(u2).startsWith('group-')) {
          const isMember = await GroupMember.findOne({ where: { groupId: u2, userId: req.user.employeeId } });
          const isPrivileged = ['IT Admin', 'Chairman', 'CEO'].includes(req.user.role);
          if (!isMember && !isPrivileged) {
              return res.status(403).json({ error: 'You are not a member of this group' });
          }
      }

      const messages = await Message.findAll({
        where: { receiverId: u2 },
        order: [['createdAt', 'ASC']],
        include: [{ model: User, as: 'Sender', attributes: ['fullName', 'employeeId'] }],
        limit: 100 
      });
      return res.json(messages);
    }
    
    // Permission check: Only participants OR IT Admin, Chairman, CEO can view
    const isParticipant = req.user.id == u1 || req.user.id == u2;
    const isPrivileged = ['IT Admin', 'Chairman', 'CEO'].includes(req.user.role);
    
    if (!isParticipant && !isPrivileged) {
      return res.status(403).json({ error: 'Unauthorized access to this conversation' });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: u1, receiverId: u2 },
          { senderId: u2, receiverId: u1 }
        ]
      },
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (err) { res.status(500).json({ error: 'History failed' }); }
});

// ── Get Recent Messages ──
router.get('/recent', protect, async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { receiverId: String(req.user.id) },
                    { receiverId: req.user.employeeId }
                ]
            },
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'Sender', attributes: ['fullName'] }],
            limit: 3
        });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recent messages' });
    }
});

// ── Get Conversations Summary (Latest message & unread counts for WhatsApp sorting) ──
router.get('/conversations', protect, async (req, res) => {
    try {
        const myIds = [String(req.user.id), String(req.user.employeeId)];
        
        // Find all messages involving user
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: myIds },
                    { receiverId: myIds },
                    { receiverId: { [Op.like]: 'group-%' } }
                ]
            },
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'Sender', attributes: ['fullName', 'employeeId'] }],
            limit: 500
        });

        const lastMessages = {};
        const unreadCounts = {};
        let totalUnread = 0;

        messages.forEach(m => {
            const isGroup = String(m.receiverId).startsWith('group-') || String(m.receiverId).length > 20;
            const contactId = isGroup 
                ? m.receiverId 
                : (myIds.includes(String(m.senderId)) ? m.receiverId : m.senderId);

            // Set last message if not already set (since query is ordered DESC)
            if (!lastMessages[contactId]) {
                lastMessages[contactId] = {
                    content: m.content || (m.fileUrl ? '📎 Shared a file' : ''),
                    time: new Date(m.createdAt).getTime(),
                    senderId: m.senderId,
                    senderName: m.Sender ? m.Sender.fullName : 'Someone'
                };
            }

            // Calculate unread (if received by me and isRead is false)
            if (!isGroup && myIds.includes(String(m.receiverId)) && !m.isRead) {
                unreadCounts[contactId] = (unreadCounts[contactId] || 0) + 1;
                totalUnread++;
            }
        });

        res.json({ lastMessages, unreadCounts, totalUnread });
    } catch (err) {
        console.error('Conversations error:', err);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// ── Get Unread Counts ──
router.get('/unread', protect, async (req, res) => {
    try {
        const unreadMsgs = await Message.findAll({
            where: {
                receiverId: [String(req.user.id), req.user.employeeId],
                isRead: false
            }
        });
        const counts = {};
        let total = 0;
        unreadMsgs.forEach(m => {
            counts[m.senderId] = (counts[m.senderId] || 0) + 1;
            total++;
        });
        res.json({ counts, total });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch unread' });
    }
});

// ── Upload File ──
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, type: req.file.mimetype, name: req.file.originalname });
});

// ── Create Group ──
router.post('/groups', protect, async (req, res) => {
    try {
        const { name, members } = req.body; // members is array of employeeIds
        if (!name) return res.status(400).json({ error: 'Group name required' });

        const group = await Group.create({
            name,
            createdBy: req.user.employeeId
        });

        // Add creator as Admin
        await GroupMember.create({
            groupId: group.id,
            userId: req.user.employeeId,
            role: 'Admin'
        });

        // Add other members
        if (Array.isArray(members)) {
            for (const mid of members) {
                if (mid !== req.user.employeeId) {
                    await GroupMember.create({
                        groupId: group.id,
                        userId: mid,
                        role: 'Member'
                    });
                }
            }
        }

        res.json(group);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Group creation failed' });
    }
});

// ── Get User's Groups ──
router.get('/my-groups', protect, async (req, res) => {
    try {
        const memberships = await GroupMember.findAll({
            where: { userId: req.user.employeeId },
            include: [{ model: Group }]
        });
        const groups = memberships.map(m => m.Group);
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

module.exports = router;
