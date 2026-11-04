const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all tasks
router.get('/', protect, async (req, res) => {
    try {
        let whereClause = {};
        if (!['IT Admin', 'Chairman', 'CEO'].includes(req.user.role)) {
            whereClause = {
                [Op.or]: [
                    { assignedBy: req.user.id },
                    { assignedTo: req.user.id }
                ]
            };
        }

        const tasks = await Task.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'Assignee', attributes: ['id', 'fullName'] },
                { model: User, as: 'Creator', attributes: ['id', 'fullName'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Create task
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, assignedTo, priority, deadline } = req.body;
        
        // Generate Logical Ticket ID
        const maxId = (await Task.max('id')) || 0;
        let nextNum = maxId + 1;
        let taskId = `EXO-TKT-${1000 + nextNum}`;
        while (await Task.findOne({ where: { taskId } })) {
            nextNum++;
            taskId = `EXO-TKT-${1000 + nextNum}`;
        }
        
        const task = await Task.create({ 
            taskId, title, description, assignedTo, assignedBy: req.user.id, priority, deadline 
        });

        // Send App Notification
        if (assignedTo && String(assignedTo) !== String(req.user.id)) {
            await Notification.create({
                userId: assignedTo,
                title: 'Task Assigned',
                message: `You have been assigned a new task: ${title}`,
                type: 'TASK',
                relatedId: task.id
            });
        }

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task
router.patch('/:id', protect, async (req, res) => {
    try {
        const { status, priority, title, description } = req.body;
        const task = await Task.findByPk(req.params.id);
        if (!task) return res.status(404).json({ error: 'Not found' });
        
        // Authorization Check
        const canUpdate = 
            ['IT Admin', 'Chairman', 'CEO'].includes(req.user.role) ||
            task.assignedTo === req.user.id ||
            task.assignedBy === req.user.id;

        if (!canUpdate) {
            return res.status(403).json({ error: 'Not authorized to update this task' });
        }

        await task.update({ status, priority, title, description });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

module.exports = router;

