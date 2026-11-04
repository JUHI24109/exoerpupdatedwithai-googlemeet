const express = require('express');
const { Op } = require('sequelize');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to check if user is HR/Admin
function isHRorAdmin(user) {
  return ['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(user.role);
}

// Create a new reminder
router.post('/', protect, async (req, res) => {
  try {
    const { message, reminderDateTime, isPublic, targetRoles } = req.body;
    if (!message || !reminderDateTime) {
      return res.status(400).json({ error: 'Message and reminder date/time are required' });
    }

    const reminder = await Reminder.create({
      userId: req.user.id,
      message,
      reminderDateTime: new Date(reminderDateTime), // Ensure it's a Date object
      isPublic: !!isPublic,
      targetRoles: targetRoles ? JSON.parse(targetRoles) : null,
    });

    // Broadcast new reminder for real-time sync
    const io = req.app.get('io');
    if (io) {
      const fullReminder = await Reminder.findByPk(reminder.id, {
        include: [{ model: User, as: 'User', attributes: ['fullName', 'role'] }]
      });
      // Broadcast to everyone if public or targeted roles include the user, otherwise just to the owner
      if (isPublic) {
        io.emit('reminder_update', { action: 'created', reminder: fullReminder });
      } else if (targetRoles && targetRoles.length) {
        // Emit to each role's room (we'll assume role‑based rooms are joined elsewhere)
        const parsedRoles = typeof targetRoles === 'string' ? JSON.parse(targetRoles) : targetRoles;
        parsedRoles.forEach(r => io.emit(`role_${r}`, { action: 'created', reminder: fullReminder }));
      } else {
        io.to(String(req.user.id)).emit('reminder_update', { action: 'created', reminder: fullReminder });
      }
    }

    res.status(201).json(reminder);
  } catch (e) {
    console.error('Failed to create reminder:', e);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Get personal reminders (Today and Future)
router.get('/my', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Include reminders from the start of today

    const where = {
      userId: req.user.id,
      isDismissed: false,
      isDeleted: false,
      reminderDateTime: {
        [Op.gte]: today, // Greater than or equal to today
      },
    };

    const reminders = await Reminder.findAll({
      where,
      order: [['reminderDateTime', 'ASC']],
    });
    res.json(reminders);
  } catch (e) {
    console.error('Failed to fetch my reminders:', e);
    res.status(500).json({ error: 'Failed to fetch my reminders' });
  }
});

// Get personal history reminders
router.get('/history', protect, async (req, res) => {
  try {
    const where = {
      userId: req.user.id,
      isDeleted: false,
      isDismissed: true
    };

    const reminders = await Reminder.findAll({
      where,
      order: [['updatedAt', 'DESC']],
    });
    res.json(reminders);
  } catch (e) {
    console.error('Failed to fetch reminder history:', e);
    res.status(500).json({ error: 'Failed to fetch reminder history' });
  }
});

// Get all reminders for "Operations Activity Throughput" (HR/Admin/Executive)
router.get('/all', protect, async (req, res) => {
  try {
    const isHR = ['HR', 'HR Manager', 'IT Admin'].includes(req.user.role);
    const isCEO = ['CEO', 'Chairman'].includes(req.user.role);
    
    // Only HR/IT Admin and CEO/Chairman can view all reminders
    if (!isHR && !isCEO) {
      return res.status(403).json({ error: 'Unauthorized to view all reminders' });
    }

    let where;
    
    if (isHR) {
      // HR can see: public reminders + reminders targeting any of their role + own reminders
      const role = req.user.role;
      where = {
        isDismissed: false,
        [Op.or]: [
          { isPublic: true },
          { userId: req.user.id },
          { targetRoles: { [Op.contains]: [role] } }
        ]
      };
    } else if (isCEO) {
      // CEO/Chairman see: public + their own + reminders targeting their role
      const role = req.user.role;
      where = {
        isDismissed: false,
        [Op.or]: [
          { isPublic: true },
          { userId: req.user.id },
          { targetRoles: { [Op.contains]: [role] } }
        ]
      };
    } else {
      // Fallback - just own
      where = { userId: req.user.id, isDismissed: false };
    }

    const reminders = await Reminder.findAll({
      where,
      include: [{ model: User, as: 'User', attributes: ['fullName', 'role'] }],
      order: [['reminderDateTime', 'ASC']],
    });
    res.json(reminders);
  } catch (e) {
    console.error('Failed to fetch all reminders:', e);
    res.status(500).json({ error: 'Failed to fetch all reminders' });
  }
});

// Update a reminder (e.g., mark as dismissed)
router.put('/:id', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findByPk(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

    // Only owner or HR/Admin can update
    if (reminder.userId !== req.user.id && !isHRorAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized to update this reminder' });
    }

    await reminder.update(req.body);

    // Broadcast update
    const io = req.app.get('io');
    if (io) {
      io.to(String(reminder.userId)).emit('reminder_update', { action: 'updated', reminderId: reminder.id, data: req.body });
    }

    res.json(reminder);
  } catch (e) {
    console.error('Failed to update reminder:', e);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});


// Delete a reminder (optional, can just dismiss instead)
router.delete('/:id', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findByPk(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });

    // Only owner or HR/Admin can delete
    if (reminder.userId !== req.user.id && !isHRorAdmin(req.user)) {
      return res.status(403).json({ error: 'Unauthorized to delete this reminder' });
    }

    await reminder.update({ isDeleted: true });

    // Broadcast deletion
    const io = req.app.get('io');
    if (io) {
      io.to(String(reminder.userId)).emit('reminder_update', { action: 'deleted', reminderId: req.params.id });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (e) {
    console.error('Failed to delete reminder:', e);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

module.exports = router;