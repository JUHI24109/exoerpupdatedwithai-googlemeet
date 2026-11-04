const express = require('express');
const { Op } = require('sequelize');
const LeaveRequest = require('../models/LeaveRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

const { notifyUser } = require('../utils/notifier');

// Apply for Leave
router.post('/', protect, async (req, res) => {
    try {
        const { startDate, endDate, reason, type } = req.body;
        const leave = await LeaveRequest.create({
            userId: req.user.id,
            startDate,
            endDate,
            reason,
            type,
            status: 'Pending',
            hrStatus: 'Pending',
            ceoStatus: 'Pending'
        });

        // Notify HR Managers
        const hrs = await User.findAll({ where: { role: ['HR', 'HR Manager'] } });
        for (const hr of hrs) {
            await notifyUser(req.app, hr.id, {
                title: 'New Leave Request',
                message: `${req.user.name} applied for leave (${startDate} to ${endDate})`,
                type: 'LEAVE',
                relatedId: leave.id
            });
        }

        res.status(201).json(leave);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Approval Flow
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body; // 'Approved' or 'Rejected'
        const leave = await LeaveRequest.findByPk(req.params.id);
        if (!leave) return res.status(404).json({ error: 'Leave not found' });

        const userRole = req.user.role;

        if (userRole === 'HR' || userRole === 'HR Manager') {
            leave.hrStatus = status; // Approved / Rejected / Hold
            leave.ceoStatus = status; // keep in sync, CEO step removed
            leave.status = status;
            if (status === 'Approved') {
                leave.approvedById = req.user.id;
            }
        } else {
            return res.status(403).json({ error: 'Only HR can update leave status' });
        }

        await leave.save();

        // Notify Employee of the specific step
        await notifyUser(req.app, leave.userId, {
            title: `Leave Update: ${status}`,
            message: `Your leave request has been marked as ${status} by ${userRole}.`,
            type: 'LEAVE',
            relatedId: leave.id
        });

        res.json(leave);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get My Leaves
router.get('/my-leaves', protect, async (req, res) => {
    try {
        const leaves = await LeaveRequest.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
        res.json(leaves);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get All Leaves (Admin View)
router.get('/all', protect, async (req, res) => {
    try {
        const leaves = await LeaveRequest.findAll({
            include: [{ model: User, as: 'Employee', attributes: ['fullName', 'employeeId', 'role'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(leaves);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Month-filtered leaves for HR/Admin reporting
router.get('/report/monthly', protect, async (req, res) => {
    try {
        const { month } = req.query; // format: YYYY-MM
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'month query is required in YYYY-MM format' });
        }

        const start = `${month}-01`;
        const endDate = new Date(`${month}-01`);
        endDate.setMonth(endDate.getMonth() + 1);
        const end = endDate.toISOString().slice(0, 10);

        const leaves = await LeaveRequest.findAll({
            where: {
                [Op.or]: [
                    { startDate: { [Op.gte]: start, [Op.lt]: end } },
                    { endDate: { [Op.gte]: start, [Op.lt]: end } },
                    {
                        [Op.and]: [
                            { startDate: { [Op.lt]: start } },
                            { endDate: { [Op.gte]: end } }
                        ]
                    }
                ]
            },
            include: [{ model: User, as: 'Employee', attributes: ['fullName', 'employeeId', 'role'] }],
            order: [['startDate', 'ASC']]
        });

        const summary = {
            month,
            total: leaves.length,
            approved: leaves.filter(l => l.status === 'Approved').length,
            rejected: leaves.filter(l => l.status === 'Rejected').length,
            pending: leaves.filter(l => l.status === 'Pending').length,
            hold: leaves.filter(l => l.status === 'Hold').length
        };

        res.json({ summary, leaves });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
