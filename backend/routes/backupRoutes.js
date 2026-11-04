const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const systemBackupService = require('../services/systemBackupService');
const router = express.Router();

// POST /api/backup/system - IT Admin only
router.post('/system', protect, async (req, res) => {
  try {
    // Only IT Admin allowed
    if (req.user.role !== 'IT Admin') {
      return res.status(403).json({ error: 'Only IT Admin can perform system backup' });
    }
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: 'targetEmail is required' });
    }
    // Generate backup zip
    const zipPath = await systemBackupService.createSystemBackup();
    // Send email using emailService (employeeId from authenticated user)
    const emailService = require('../services/emailService');
    await emailService.sendBackupEmail(targetEmail, req.user.employeeId, zipPath);
    // Optionally delete zip after sending (fire‑and‑forget)
    // fs.unlinkSync(zipPath);
    res.json({ message: 'Backup created and emailed successfully' });
  } catch (e) {
    console.error('System backup error:', e);
    res.status(500).json({ error: 'Failed to create system backup' });
  }
});

module.exports = router;
