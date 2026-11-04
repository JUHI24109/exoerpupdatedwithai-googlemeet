const express = require('express');
const Holiday = require('../models/Holiday');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all holidays
router.get('/', protect, async (req, res) => {
  try {
    const holidays = await Holiday.findAll({ order: [['date', 'ASC']] });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new holiday (Admin only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'IT Admin' && req.user.role !== 'HR Manager' && req.user.role !== 'CEO' && req.user.role !== 'Chairman') {
      return res.status(403).json({ error: 'Not authorized to add holidays' });
    }
    const { date, name, type } = req.body;
    const holiday = await Holiday.create({ date, name, type });
    res.status(201).json(holiday);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a holiday (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'IT Admin' && req.user.role !== 'HR Manager' && req.user.role !== 'CEO' && req.user.role !== 'Chairman') {
      return res.status(403).json({ error: 'Not authorized to delete holidays' });
    }
    const holiday = await Holiday.findByPk(req.params.id);
    if (!holiday) return res.status(404).json({ error: 'Not found' });
    
    await holiday.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
