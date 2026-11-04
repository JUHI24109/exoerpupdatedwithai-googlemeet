const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const sequelize = require('../config/db');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { sendWhatsApp } = require('../utils/notification');
const crypto = require('crypto');

const router = express.Router();

// ── Login ──
router.post('/login', async (req, res) => {
  const { employeeId, password } = req.body;
  try {
    const user = await User.findOne({
      where: sequelize.where(
        sequelize.fn('UPPER', sequelize.col('employeeId')),
        employeeId.toUpperCase()
      )
    });

    if (!user) return res.status(401).json({ error: 'Invalid ID' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user.id, employeeId: user.employeeId, role: user.role, name: user.fullName },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, employeeId: user.employeeId, name: user.fullName, role: user.role } });
  } catch (err) { res.status(500).json({ error: 'Login failure' }); }
});

// ── Create Account (Only IT Admin, Chairman, CEO) ──
router.post('/create', protect, restrictTo('IT Admin', 'Chairman', 'CEO'), async (req, res) => {
  try {
    const {
      employeeId, fullName, email, password, role, department,
      phone, whatsappNumber, joiningDate, nif, passportNumber, iban, designation,
      calendarEmail, calendarProvider
    } = req.body;

    // Check if user exists
    const existing = await User.findOne({ where: { employeeId } });
    if (existing) return res.status(400).json({ error: 'User ID already exists' });

    const emailExisting = await User.findOne({ where: { email } });
    if (emailExisting) return res.status(400).json({ error: 'Email already exists' });

    // Restriction: Only IT Admin can create Level accounts
    if ((role === 'Level 3' || role === 'Level 4' || role === 'Level 5') && req.user.role !== 'IT Admin') {
      return res.status(403).json({ error: 'Only IT Admin can create Level accounts' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      employeeId, fullName, email, password: hashed, role, department,
      phone, whatsappNumber, joiningDate, nif, passportNumber, iban, designation,
      calendarEmail, calendarProvider
    });

    // Notify other clients about the new user
    const io = req.app.get('io');
    if (io) {
      io.emit('user_created', { employeeId, fullName, role, department });
    }

    // Send Welcome WhatsApp
    if (whatsappNumber || phone) {
      const recipient = whatsappNumber || phone;
      const welcomeSid = process.env.TWILIO_WELCOME_CONTENT_SID;

      // We pass the data as variables for the template
      const welcomeVars = {
        "1": fullName,
        "2": employeeId,
        "3": password
      };

      // Message string is fallback for plain text mode
      const welcomeMsg = `Welcome to EXO GLOBAL! Hello ${fullName}, your account is ready. ID: ${employeeId}, Password: ${password}. Please use 'Forgot Password' to change it.`;

      await sendWhatsApp(recipient, welcomeMsg, welcomeSid, welcomeVars);
    }

    // Auto-create document folder
    const fs = require('fs');
    const path = require('path');
    const sanitizedEmp = String(employeeId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const folderPath = path.join(__dirname, '..', 'uploads', 'employee-documents', sanitizedEmp);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      fs.writeFileSync(path.join(folderPath, '.keep'), 'Auto-generated for new employee', 'utf8');
    }

    res.status(201).json({ message: 'User created successfully', user: { id: user.id, employeeId: user.employeeId } });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create user' });
  }
});

// ── Get All Users ──
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['fullName', 'ASC']]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── Profile Management ──
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password', 'otpCode', 'otpExpiry'] } });
    res.json(user);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch profile' }); }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const fields = [
      'fullName', 'phone', 'whatsappNumber', 'dob', 'placeOfBirth',
      'bloodGroup', 'medicalIssues', 'qualification', 'passportNumber',
      'nif', 'niss', 'sns', 'residentialDocId', 'iban',
      'permanentAddress', 'currentAddress', 'profilePic', 'designation',
      'calendarEmail', 'calendarProvider'
    ];

    const updateData = {};
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updateData[f] = req.body[f] === '' ? null : req.body[f];
      }
    });

    await User.update(updateData, { where: { id: req.user.id } });
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(400).json({ error: 'Update failed' });
  }
});

// ── Password Reset via WhatsApp ──
router.post('/password-reset/request', async (req, res) => {
  const { employeeId } = req.body;
  try {
    const user = await User.findOne({
      where: sequelize.where(
        sequelize.fn('UPPER', sequelize.col('employeeId')),
        employeeId.toUpperCase()
      )
    });

    const contactNumber = user?.whatsappNumber || user?.phone;
    if (!user || !contactNumber) {
      return res.status(404).json({ error: 'Mobile number not found. Please contact IT Admin.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await User.update({ otpCode: otp, otpExpiry: expiry }, { where: { id: user.id } });

    const result = await sendWhatsApp(contactNumber, `EXO GLOBAL Security: Your password reset code is ${otp}. Valid for 10 minutes.`);

    if (result.status === 'simulated') {
      return res.json({
        message: 'OTP Simulated (Developer Mode). Check the server terminal for the code.',
        simulated: true,
        code: otp // Only for dev convenience
      });
    }

    if (result.status === 'error') {
      return res.status(500).json({ error: 'WhatsApp service error: ' + result.message });
    }

    res.json({ message: 'OTP sent to your WhatsApp number' });
  } catch (err) { res.status(500).json({ error: 'Failed to send OTP' }); }
});

router.post('/password-reset/verify', async (req, res) => {
  const { employeeId, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      where: {
        otpCode: otp,
        [Op.and]: [
          sequelize.where(
            sequelize.fn('UPPER', sequelize.col('employeeId')),
            employeeId.toUpperCase()
          )
        ]
      }
    });
    if (!user || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    // OTP is valid – generate short‑lived reset token
    const resetToken = jwt.sign({ id: user.id, reset: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    // Optionally update password now or wait for separate endpoint
    // Here we just return the token; client will call /password-reset/complete
    res.json({ message: 'OTP verified', resetToken });
  } catch (err) { res.status(500).json({ error: 'Reset failed' }); }
});

// Middleware to verify reset token
function verifyReset(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (!payload.reset) throw new Error('Not a reset token');
    req.resetUserId = payload.id;
    next();
  } catch (e) { res.status(401).json({ error: 'Invalid reset token' }); }
}

// Complete password reset – requires reset token
router.post('/password-reset/complete', verifyReset, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'New password required' });
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashed, otpCode: null, otpExpiry: null }, { where: { id: req.resetUserId } });
    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (e) { res.status(500).json({ error: 'Failed to reset password' }); }
});


// ── Admin: Update Any User ──
router.put('/user/:employeeId', protect, restrictTo('IT Admin'), async (req, res) => {
  try {
    const fields = [
      'fullName', 'email', 'phone', 'whatsappNumber', 'role', 'department',
      'designation', 'joiningDate', 'isActive', 'calendarEmail', 'calendarProvider'
    ];
    const updateData = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

    await User.update(updateData, { where: { employeeId: req.params.employeeId } });
    res.json({ message: 'User updated successfully' });
  } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});

// ── Admin: Delete User ──
router.delete('/user/:employeeId', protect, restrictTo('IT Admin'), async (req, res) => {
  try {
    await User.destroy({ where: { employeeId: req.params.employeeId } });
    res.json({ message: 'User deleted successfully' });
  } catch (err) { res.status(500).json({ error: 'Deletion failed' }); }
});

// ── Impersonate User (Admin/CEO/Chairman Only) ──
router.post('/impersonate/:employeeId', protect, restrictTo('IT Admin', 'Chairman', 'CEO'), async (req, res) => {
  try {
    const user = await User.findOne({ where: { employeeId: req.params.employeeId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign(
      { id: user.id, employeeId: user.employeeId, role: user.role, name: user.fullName },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, employeeId: user.employeeId, name: user.fullName, role: user.role } });
  } catch (err) { res.status(500).json({ error: 'Impersonation failed' }); }
});

// ── Get Employee Report Card (Aggregated Profiles) ──
router.get('/employee-report/:employeeId', protect, restrictTo('IT Admin', 'Chairman', 'CEO', 'HR', 'HR Manager'), async (req, res) => {
  try {
    const targetUser = await User.findOne({ 
      where: { employeeId: req.params.employeeId },
      attributes: { exclude: ['password', 'otpCode', 'otpExpiry'] }
    });
    if (!targetUser) return res.status(404).json({ error: 'Employee not found' });

    // Dynamic imports
    const Task = require('../models/Task');
    const Ticket = require('../models/Ticket');
    const Attendance = require('../models/Attendance');
    const LeaveRequest = require('../models/LeaveRequest');
    const UndertakingAsset = require('../models/UndertakingAsset');

    // Fetch tasks
    const tasks = await Task.findAll({ where: { assignedTo: targetUser.id } });
    
    // Fetch tickets
    const tickets = await Ticket.findAll({ 
      where: { 
        isDeleted: false,
        [Op.or]: [
          { creatorId: targetUser.id },
          { currentAssigneeId: targetUser.id }
        ]
      }
    });

    // Fetch attendance logs
    const attendance = await Attendance.findAll({ 
      where: { userId: targetUser.id },
      order: [['date', 'DESC']],
      limit: 30
    });

    // Fetch leaves
    const leaves = await LeaveRequest.findAll({ 
      where: { userId: targetUser.id },
      order: [['createdAt', 'DESC']]
    });

    // Fetch assets
    const assets = await UndertakingAsset.findAll({
      where: { employeeId: targetUser.employeeId }
    });

    // Calculations
    const totalAttendance = attendance.length;
    const presentAttendance = attendance.filter(a => a.status === 'Present').length;
    const attendancePct = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 100;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;

    res.json({
      employee: targetUser,
      stats: {
        attendance: {
          total: totalAttendance,
          present: presentAttendance,
          pct: attendancePct,
          records: attendance
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          pending: pendingTasks,
          list: tasks
        },
        tickets: {
          total: tickets.length,
          list: tickets
        },
        leaves: {
          total: leaves.length,
          approved: leaves.filter(l => l.status === 'Approved').length,
          list: leaves
        },
        assets: {
          total: assets.length,
          list: assets
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to aggregate employee report card' });
  }
});

module.exports = router;

