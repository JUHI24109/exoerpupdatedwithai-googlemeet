const express = require('express');
const { Op } = require('sequelize');
const TodoItem = require('../models/TodoItem');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { title, description, dueDate, reminderMonth } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const row = await TodoItem.create({
      userId: req.user.id,
      title,
      description,
      dueDate,
      reminderMonth
    });

    // Broadcast new todo for real-time throughput sync
    const io = req.app.get('io');
    if (io) {
      const fullTodo = await TodoItem.findByPk(row.id, {
        include: [{ model: User, as: 'User', attributes: ['fullName', 'role'] }]
      });
      io.to(String(req.user.id)).emit('todo_update', { action: 'created', todo: fullTodo });
    }

    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const month = req.query.month;
    // Active todos only
    const where = { userId: req.user.id, isDeleted: false, isDone: false };

    if (month) {
      where[Op.or] = [
        { reminderMonth: month },
        { 
          dueDate: {
            [Op.gte]: `${month}-01`,
            [Op.lte]: `${month}-31`
          } 
        }
      ];
    }

    const rows = await TodoItem.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    // Completed todos
    const rows = await TodoItem.findAll({ 
      where: { userId: req.user.id, isDeleted: false, isDone: true }, 
      order: [['updatedAt', 'DESC']] 
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch todo history' });
  }
});

router.get('/all', protect, async (req, res) => {
  try {
    const isHR = ['HR', 'HR Manager', 'IT Admin'].includes(req.user.role);
    const isCEO = ['CEO', 'Chairman'].includes(req.user.role);
    
    // Only HR and Executives can view all todos
    if (!isHR && !isCEO) {
      return res.status(403).json({ error: 'Unauthorized to view all todos' });
    }

    let where;
    
    if (isHR) {
      // HR sees: own + CEO + Chairman todos
      const [ceo] = await User.findAll({ where: { role: 'CEO' } });
      const [chairman] = await User.findAll({ where: { role: 'Chairman' } });
      
where = {
        isDeleted: false,
        [Op.or]: [
          { userId: req.user.id },
          ...(ceo ? [{ userId: ceo.id }] : []),
          ...(chairman ? [{ userId: chairman.id }] : [])
        ]
      };
    } else {
      // CEO/Chairman sees only own + public ones (NOT other employees' private todos)
      where = { 
        isDeleted: false,
        [Op.or]: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      };
    }

    const rows = await TodoItem.findAll({
        where, 
        include: [{ model: User, as: 'User', attributes: ['fullName', 'role'] }],
        order: [['createdAt', 'DESC']] 
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch all todos' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const row = await TodoItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ error: 'Todo not found' });
    await row.update(req.body);

    // Broadcast update for real-time throughput sync (e.g. marking as Done)
    const io = req.app.get('io');
    if (io) {
      io.to(String(req.user.id)).emit('todo_update', { action: 'updated', todoId: row.id, data: req.body });
    }

    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const row = await TodoItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!row) return res.status(404).json({ error: 'Todo not found' });
    await row.update({ isDeleted: true });

    // Broadcast deletion
    const io = req.app.get('io');
    if (io) {
      io.to(String(req.user.id)).emit('todo_update', { action: 'deleted', todoId: row.id });
    }

    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
