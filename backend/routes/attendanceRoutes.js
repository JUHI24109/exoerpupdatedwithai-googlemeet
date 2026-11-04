const express = require('express');
const { Op } = require('sequelize');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Load Portuguese public holidays (YYYY-MM-DD strings)
const publicHolidays = require('../data/public_holidays_pt.json');

const router = express.Router();

router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
    res.json(record);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/checkin', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Disallow check‑in on public holidays
    if (publicHolidays.includes(today)) {
      return res.status(400).json({ error: 'Today is a public holiday; cannot check in.' });
    }
    const existing = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
    if (existing) {
      return res.status(400).json({ error: 'Already clocked in for today' });
    }
    const record = await Attendance.create({ userId: req.user.id, date: today, loginTime: new Date(), status: 'Present' });
    res.json(record);
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

router.post('/checkout', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
    if (record) {
      const logout = new Date();
      record.logoutTime = logout;
      
      if (record.loginTime) {
        const msDiff = logout - new Date(record.loginTime);
        const hours = msDiff / (1000 * 60 * 60);
        record.hoursWorked = hours;
        
        // 9 hours threshold
        if (hours >= 9) {
          record.status = 'Present'; // Green
        } else {
          record.status = 'Half Day'; // Or could be Red depending on HR rules
        }
      }

      await record.save();
      res.json(record);
    } else res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get my own attendance records
router.get('/mine', protect, async (req, res) => {
  try {
    const records = await Attendance.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']],
      limit: 60
    });
    res.json(records);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// HR/Admin day-wise attendance view
router.get('/summary', protect, async (req, res) => {
  try {
    const { month } = req.query; // format: YYYY-MM
    const start = month ? `${month}-01` : new Date().toISOString().slice(0, 8) + '01';
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().slice(0, 10);
    // Fetch attendance records for the period
    const records = await Attendance.findAll({
      where: { userId: req.user.id, date: { [Op.gte]: start, [Op.lt]: end } }
    });
    // Compute summary counts
    const summary = { totalDays: 0, present: 0, halfDay: 0, absent: 0, leave: 0, holiday: 0 };
    // Build a set of all dates in the month
    const dateSet = new Set();
    for (let d = new Date(start); d < new Date(end); d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      dateSet.add(iso);
    }
    // Mark holidays in the set
    const holidaysInMonth = publicHolidays.filter(h => dateSet.has(h));
    summary.holiday = holidaysInMonth.length;
    // Count attendance statuses
    for (const rec of records) {
      summary.totalDays += 1;
      if (rec.status === 'Present') summary.present += 1;
      else if (rec.status === 'Half Day') summary.halfDay += 1;
      else if (rec.status === 'Absent') summary.absent += 1;
      else if (rec.status === 'Leave') summary.leave += 1;
    }
    // Account for days with no record (treated as absent unless holiday)
    for (const d of dateSet) {
      if (holidaysInMonth.includes(d)) continue;
      if (!records.find(r => r.date === d)) {
        summary.absent += 1;
        summary.totalDays += 1;
      }
    }
    res.json(summary);
  } catch (err) {
    console.error('Attendance summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// HR/Admin day-wise attendance view
router.get('/admin/day', protect, async (req, res) => {
  try {
    if (!['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const records = await Attendance.findAll({
      where: { date },
      include: [{ model: User, as: 'Employee', attributes: ['id', 'fullName', 'employeeId', 'role'] }],
      order: [['loginTime', 'ASC']]
    });

    res.json({ date, total: records.length, records });
  } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
});

// HR/Admin monthly attendance with filters
router.get('/admin/monthly', protect, async (req, res) => {
  try {
    if (!['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { month, employeeId } = req.query; // month format YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month query is required in YYYY-MM format' });
    }

    const start = `${month}-01`;
    const endDate = new Date(`${month}-01`);
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().slice(0, 10);

    const where = {
      date: { [Op.gte]: start, [Op.lt]: end }
    };

    if (employeeId) where.userId = employeeId;

    const records = await Attendance.findAll({
      where,
      include: [{ model: User, as: 'Employee', attributes: ['id', 'fullName', 'employeeId', 'role'] }],
      order: [['date', 'ASC']]
    });

    const grouped = {};
    for (const r of records) {
      const key = `${r.userId}`;
      if (!grouped[key]) {
        grouped[key] = {
          userId: r.userId,
          employeeId: r.Employee?.employeeId || '',
          fullName: r.Employee?.fullName || 'Unknown',
          role: r.Employee?.role || '',
          totalDays: 0,
          presentDays: 0,
          halfDays: 0,
          absentDays: 0,
          leaveDays: 0,
          totalHoursWorked: 0
        };
      }
      grouped[key].totalDays += 1;
      if (r.status === 'Present') grouped[key].presentDays += 1;
      if (r.status === 'Half Day') grouped[key].halfDays += 1;
      if (r.status === 'Absent') grouped[key].absentDays += 1;
      if (r.status === 'Leave') grouped[key].leaveDays += 1;
      grouped[key].totalHoursWorked += Number(r.hoursWorked || 0);
    }

    res.json({
      month,
      summary: Object.values(grouped),
      records
    });
  } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
});

// HR/Admin date range attendance with filters
router.get('/admin/range', protect, async (req, res) => {
  try {
    if (!['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { from, to, employeeId } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to queries are required (YYYY-MM-DD)' });
    }

    const start = new Date(from);
    const endDate = new Date(to);
    endDate.setDate(endDate.getDate() + 1); // include the 'to' date
    const end = endDate.toISOString().slice(0, 10);

    const where = {
      date: { [Op.gte]: from, [Op.lt]: end }
    };

    if (employeeId) where.userId = employeeId;

    const records = await Attendance.findAll({
      where,
      include: [{ model: User, as: 'Employee', attributes: ['id', 'fullName', 'employeeId', 'role'] }],
      order: [['date', 'ASC']]
    });

    const grouped = {};
    for (const r of records) {
      const key = `${r.userId}`;
      if (!grouped[key]) {
        grouped[key] = {
          userId: r.userId,
          employeeId: r.Employee?.employeeId || '',
          fullName: r.Employee?.fullName || 'Unknown',
          role: r.Employee?.role || '',
          totalDays: 0,
          presentDays: 0,
          halfDays: 0,
          absentDays: 0,
          leaveDays: 0,
          totalHoursWorked: 0,
          records: []
        };
      }
      grouped[key].totalDays += 1;
      if (r.status === 'Present') grouped[key].presentDays += 1;
      if (r.status === 'Half Day') grouped[key].halfDays += 1;
      if (r.status === 'Absent') grouped[key].absentDays += 1;
      if (r.status === 'Leave') grouped[key].leaveDays += 1;
      grouped[key].totalHoursWorked += Number(r.hoursWorked || 0);
      grouped[key].records.push(r);
    }

    res.json({
      from,
      to,
      summary: Object.values(grouped)
    });
  } catch (err) { res.status(500).json({ error: err.message || 'Failed' }); }
});

// Get list of all employees (for filter dropdown)
router.get('/admin/employees', protect, async (req, res) => {
  try {
    const employees = await User.findAll({ attributes: ['id', 'fullName', 'employeeId'], order: [['fullName', 'ASC']] });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed' });
  }
});

module.exports = router;
