const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const EmployeeDocument = require('../models/EmployeeDocument');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const uploadBaseDir = path.join(__dirname, '..', 'uploads', 'employee-documents');
if (!fs.existsSync(uploadBaseDir)) fs.mkdirSync(uploadBaseDir, { recursive: true });

function sanitizeSegment(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'unknown';
}

function sanitizeFileName(fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  const base = path.basename(fileName || 'file', ext).replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${base || 'file'}${ext}`;
}

const storage = multer.diskStorage({
  destination: (req, __, cb) => {
    const employeeId = sanitizeSegment(req.body.employeeId);
    const employeeDir = path.join(uploadBaseDir, employeeId);
    if (!fs.existsSync(employeeDir)) fs.mkdirSync(employeeDir, { recursive: true });
    cb(null, employeeDir);
  },
  filename: (_, file, cb) => cb(null, sanitizeFileName(file.originalname))
});
const upload = multer({ storage, limits: { files: 20, fileSize: 25 * 1024 * 1024 } });

function isHRorAdmin(user) {
  return ['HR', 'HR Manager', 'IT Admin', 'CEO', 'Chairman'].includes(user.role);
}

router.post('/upload', protect, upload.array('files', 20), async (req, res) => {
  try {
    // Access control: HR/Admin can upload for anyone, Employee only for self
    if (!isHRorAdmin(req.user) && String(req.body.employeeId) !== String(req.user.employeeId)) {
      return res.status(403).json({ error: 'You can only upload documents to your own folder' });
    }
    // Required fields validation
    const { employeeId, employeeName, department, designation, docTitle, docType } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });
    if (!docTitle) return res.status(400).json({ error: 'Missing document title' });
    if (!docType) return res.status(400).json({ error: 'Missing document type' });
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded' });
    // File type validation (allow PDF, images, DOCX)
    const allowedMime = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    for (const f of req.files) {
      if (!allowedMime.includes(f.mimetype)) {
        return res.status(400).json({ error: `Unsupported file type: ${f.mimetype}` });
      }
    }

    const rows = [];
    for (const f of req.files) {
      const row = await EmployeeDocument.create({
        employeeId,
        employeeName,
        department,
        designation,
        docTitle,
        docType,
        fileName: f.originalname,
        fileUrl: `/uploads/employee-documents/${sanitizeSegment(employeeId)}/${f.filename}`,
        uploadedBy: req.user.id,
        updatedBy: req.user.id
      });
      rows.push(row);
    }

    res.status(201).json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Upload failed', details: e.message });
  }
});

router.get('/folders', protect, async (req, res) => {
  try {
    if (!isHRorAdmin(req.user) && String(req.query.employeeId) !== String(req.user.employeeId)) {
      if (!req.query.employeeId) {
        req.query.employeeId = req.user.employeeId; // Default to own folder for employees
      } else {
        return res.status(403).json({ error: 'Unauthorized to view these folders' });
      }
    }

    const where = { isDeleted: false };
    if (req.query.employeeId) where.employeeId = req.query.employeeId;

    const rows = await EmployeeDocument.findAll({ where, order: [['createdAt', 'DESC']] });

    const grouped = {};
    for (const d of rows) {
      const key = d.employeeId;
      if (!grouped[key]) {
        grouped[key] = {
          employeeId: d.employeeId,
          employeeName: d.employeeName,
          department: d.department,
          designation: d.designation,
          documents: []
        };
      }
      grouped[key].documents.push(d);
    }

    // Merge users as default directories (if HR/Admin, merge all users; if Employee, only merge self)
    const User = require('../models/User');
    let users = [];
    if (isHRorAdmin(req.user)) {
      users = await User.findAll({ attributes: ['employeeId', 'fullName', 'department', 'designation'] });
    } else {
      users = await User.findAll({ 
        where: { employeeId: req.user.employeeId }, 
        attributes: ['employeeId', 'fullName', 'department', 'designation'] 
      });
    }
    for (const u of users) {
      const key = u.employeeId;
      if (!grouped[key]) {
        grouped[key] = {
          employeeId: u.employeeId,
          employeeName: u.fullName,
          department: u.department,
          designation: u.designation,
          documents: []
        };
      }
    }

    res.json(Object.values(grouped));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch folders', details: e.message });
  }
});

// ── Create Folder Endpoint ──
router.post('/create-folder', protect, async (req, res) => {
  try {
    if (!isHRorAdmin(req.user) && String(req.body.employeeId) !== String(req.user.employeeId)) {
      return res.status(403).json({ error: 'Unauthorized to create folders here' });
    }

    const { employeeId, folderName } = req.body;
    if (!employeeId || !folderName) return res.status(400).json({ error: 'employeeId and folderName required' });

    const sanitizedEmp = sanitizeSegment(employeeId);
    const sanitizedFolder = sanitizeSegment(folderName);

    const folderPath = path.join(uploadBaseDir, sanitizedEmp, sanitizedFolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Create .keep file inside directory
    fs.writeFileSync(path.join(folderPath, '.keep'), 'EXO ERP Managed Directory', 'utf8');

    // Create mock database entry under type 'Folder'
    const doc = await EmployeeDocument.create({
      employeeId,
      employeeName: req.body.employeeName || 'Staff Member',
      department: req.body.department || 'Operations',
      designation: req.body.designation || 'Staff',
      docTitle: folderName,
      docType: 'Folder',
      fileName: '.keep',
      fileUrl: `/uploads/employee-documents/${sanitizedEmp}/${sanitizedFolder}/.keep`,
      uploadedBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ message: 'Folder created successfully', doc });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create folder', details: e.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const isDeleted = req.query.deleted === 'true';
    const where = { isDeleted: isDeleted };
    
    if (!isHRorAdmin(req.user)) {
      // Regular employees can only see their own docs
      where.employeeId = req.user.employeeId;
    } else if (req.query.employeeId) {
      where.employeeId = req.query.employeeId;
    }

    const rows = await EmployeeDocument.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) return res.status(403).json({ error: 'Unauthorized' });
    const row = await EmployeeDocument.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Document not found' });

    // Rename file on disk if filename changes
    if (req.body.fileName && req.body.fileName !== row.fileName) {
      const oldRelPath = row.fileUrl.replace(/^\/+/, '');
      const oldFilePath = path.normalize(path.join(__dirname, '..', oldRelPath));
      
      const ext = path.extname(req.body.fileName).toLowerCase();
      const base = path.basename(req.body.fileName, ext).replace(/[^a-zA-Z0-9._-]/g, '_');
      const newName = `${Date.now()}-${base}${ext}`;
      
      const newFileUrl = row.fileUrl.replace(path.basename(row.fileUrl), newName);
      const newRelPath = newFileUrl.replace(/^\/+/, '');
      const newFilePath = path.normalize(path.join(__dirname, '..', newRelPath));

      if (fs.existsSync(oldFilePath)) {
        fs.renameSync(oldFilePath, newFilePath);
        req.body.fileUrl = newFileUrl;
      }
    }

    await row.update({ ...req.body, updatedBy: req.user.id });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const row = await EmployeeDocument.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Document not found' });

    if (!isHRorAdmin(req.user) && String(row.employeeId) !== String(req.user.employeeId)) {
      return res.status(403).json({ error: 'Unauthorized to delete this document' });
    }

    // Soft Delete (move to History Center)
    await row.update({ isDeleted: true });
    res.json({ message: 'Deleted (moved to History)' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
