const express = require('express');
const { Parser } = require('json2csv');
const { Op } = require('sequelize');
const UndertakingAsset = require('../models/UndertakingAsset');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

function isHRorAdmin(user) {
  return ['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(user.role);
}

router.post('/', protect, async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) return res.status(403).json({ error: 'Unauthorized' });

    const payload = {
      ...req.body,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };

    const row = await UndertakingAsset.create(payload);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create undertaking asset', details: e.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) return res.status(403).json({ error: 'Unauthorized' });
    const rows = await UndertakingAsset.findAll({ order: [['createdAt', 'DESC']] });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch undertaking assets' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) return res.status(403).json({ error: 'Unauthorized' });
    const row = await UndertakingAsset.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Record not found' });

    await row.update({ ...req.body, updatedBy: req.user.id });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update undertaking asset' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) return res.status(403).json({ error: 'Unauthorized' });
    const row = await UndertakingAsset.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Record not found' });
    await row.destroy();
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete undertaking asset' });
  }
});

router.get('/report/monthly', protect, async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) return res.status(403).json({ error: 'Unauthorized' });

    const month = String(req.query.month || '').trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ error: 'month must be in YYYY-MM format' });
    }

    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
    const nextYear = monthNum === 12 ? year + 1 : year;
    const nextMonthStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const rows = await UndertakingAsset.findAll({
      where: {
        receivingDate: {
          [Op.gte]: startDate,
          [Op.lt]: nextMonthStart
        }
      },
      order: [['receivingDate', 'ASC']]
    });

    const fields = [
      'employeeId', 'employeeName', 'company', 'category', 'makeModel', 'mobileNumber', 'pin', 'puk',
      'cardNumber', 'expiryDate', 'carRegistrationNumber', 'cardPin', 'imei1', 'imei2', 'serialNumber',
      'serialNumberId', 'barcodeNo', 'productIdModelNumber', 'location', 'receivingDate', 'returnDate', 'notes'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows.map((r) => r.toJSON()));

    res.header('Content-Type', 'text/csv');
    res.attachment(`undertaking_assets_${month}.csv`);
    return res.send(csv);
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate report', details: e.message });
  }
});

module.exports = router;
