const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const ProjectFolder = require('../models/ProjectFolder');
const ProjectFile = require('../models/ProjectFile');
const ProjectLicence = require('../models/ProjectLicence');
const ProjectTask = require('../models/ProjectTask');
const ProjectTaskComment = require('../models/ProjectTaskComment');
const ProjectDiscussion = require('../models/ProjectDiscussion');
const ProjectActivity = require('../models/ProjectActivity');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyUser } = require('../utils/notifier');
const { Op } = require('sequelize');

// ── Multer for cover images ──
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/project-covers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cover-${Date.now()}${ext}`);
  }
});
const uploadCover = multer({ storage: coverStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Multer for project files ──
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/project-files');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `file-${unique}${ext}`);
  }
});
const uploadFile = multer({ storage: fileStorage, limits: { fileSize: 50 * 1024 * 1024 } });

const SUPER_ROLES = ['Chairman', 'CEO', 'IT Admin'];

// Helper: check project access and return member role (or null)
async function getProjectAccess(projectId, userId, userRole) {
  if (SUPER_ROLES.includes(userRole)) return 'Project Admin';
  const member = await ProjectMember.findOne({ where: { projectId, userId } });
  return member ? member.role : null;
}

// Default folders to create for each new project
const DEFAULT_FOLDERS = [
  'Project Images',
  'Legal & Property Documents',
  'Licences & Permits',
  'Architectural Plans',
  'Contracts & Agreements',
  'Financial Documents',
  'Meetings & Minutes',
  'Reports',
  'General Documents'
];

// Counter for project IDs
async function generateProjectId() {
  const last = await Project.findOne({ order: [['id', 'DESC']] });
  const num = last ? last.id + 1 : 1001;
  return `PRJ-${String(num).padStart(4, '0')}`;
}

// Helper to find project member IDs
async function getProjectMemberIds(projectId) {
  try {
    const members = await ProjectMember.findAll({ where: { projectId }, attributes: ['userId'] });
    const project = await Project.findByPk(projectId, { attributes: ['createdBy'] });
    const ids = members.map(m => m.userId);
    if (project && project.createdBy) ids.push(project.createdBy);
    return ids;
  } catch (e) {
    return [];
  }
}

// Helper to notify project members / users and broadcast socket update
async function sendProjectNotification(app, projectId, recipientUserIds, notifData) {
  try {
    const project = await Project.findByPk(projectId);
    const projectName = project ? project.name : 'Project';
    const io = app.get('io');

    const uniqueRecipients = [...new Set((recipientUserIds || []).filter(id => id && String(id) !== String(notifData.senderId)))];

    for (const uid of uniqueRecipients) {
      await notifyUser(app, uid, {
        title: notifData.title || `Update in ${projectName}`,
        message: notifData.message,
        type: 'PROJECT',
        relatedId: String(projectId)
      });
    }

    if (io) {
      io.emit('project_update', {
        projectId: String(projectId),
        action: notifData.action || 'update',
        title: notifData.title,
        message: notifData.message,
        tab: notifData.tab || 'tasks'
      });
    }
  } catch (err) {
    console.error('sendProjectNotification error:', err);
  }
}

// ── GET /api/projects/unread-count (for sidebar badge) ──
router.get('/unread-count', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const total = await Notification.count({
      where: {
        userId,
        type: 'PROJECT',
        isRead: false
      }
    });
    res.json({ total });
  } catch (err) {
    res.json({ total: 0 });
  }
});

// ── PUT /api/projects/mark-notifications-read ──
router.put('/mark-notifications-read', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.body || {};
    const where = {
      userId,
      type: 'PROJECT',
      isRead: false
    };
    if (projectId) {
      where.relatedId = String(projectId);
    }
    await Notification.update({ isRead: true }, { where });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

// ── GET /api/projects — list projects the user can access ──
router.get('/', protect, async (req, res) => {
  try {
    let projects;
    if (SUPER_ROLES.includes(req.user.role)) {
      projects = await Project.findAll({
        where: { isDeleted: false },
        include: [
          { model: User, as: 'Creator', attributes: ['id', 'fullName'] },
          { model: User, as: 'ProjectManager', attributes: ['id', 'fullName'] }
        ],
        order: [['updatedAt', 'DESC']]
      });
    } else {
      // Only projects user is a member of
      const memberships = await ProjectMember.findAll({ where: { userId: req.user.id } });
      const projectIds = memberships.map(m => m.projectId);
      if (!projectIds.length) return res.json([]);
      projects = await Project.findAll({
        where: { id: { [Op.in]: projectIds }, isDeleted: false },
        include: [
          { model: User, as: 'Creator', attributes: ['id', 'fullName'] },
          { model: User, as: 'ProjectManager', attributes: ['id', 'fullName'] }
        ],
        order: [['updatedAt', 'DESC']]
      });
    }
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/projects — create new project ──
router.post('/', protect, restrictTo(...SUPER_ROLES), uploadCover.single('coverImage'), async (req, res) => {
  try {
    const { name, description, location, status, projectType, startDate, expectedCompletionDate, budget, internalRef, projectManagerId } = req.body;
    if (!name || !location || !status) {
      return res.status(400).json({ error: 'Name, location and status are required' });
    }
    const projectId = await generateProjectId();
    const coverImage = req.file ? `/uploads/project-covers/${req.file.filename}` : null;

    const project = await Project.create({
      projectId,
      name: name.trim(),
      description,
      location: location.trim(),
      status,
      projectType,
      coverImage,
      startDate: startDate || null,
      expectedCompletionDate: expectedCompletionDate || null,
      budget,
      internalRef,
      progress: 0,
      creatorId: req.user.id,
      projectManagerId: projectManagerId ? parseInt(projectManagerId) : null
    });

    // Grant creator Project Admin access
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'Project Admin',
      grantedBy: req.user.id,
      grantedAt: new Date()
    });

    // Create default folders
    for (const folderName of DEFAULT_FOLDERS) {
      await ProjectFolder.create({
        projectId: project.id,
        name: folderName,
        parentId: null,
        isDefault: true,
        createdBy: req.user.id
      });
    }

    // Log activity
    await ProjectActivity.create({
      projectId: project.id,
      actorId: req.user.id,
      action: 'project_created',
      detail: `Project "${name}" created`,
      refType: 'project',
      refId: project.id
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/projects/:id — single project ──
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, isDeleted: false },
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'fullName'] },
        { model: User, as: 'ProjectManager', attributes: ['id', 'fullName'] }
      ]
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const access = await getProjectAccess(project.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    res.json({ ...project.toJSON(), userRole: access });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/projects/:id — update project ──
router.put('/:id', protect, uploadCover.single('coverImage'), async (req, res) => {
  try {
    const project = await Project.findOne({ where: { id: req.params.id, isDeleted: false } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const access = await getProjectAccess(project.id, req.user.id, req.user.role);
    if (!access || !['Project Admin'].includes(access)) {
      return res.status(403).json({ error: 'Access denied — Project Admin required' });
    }
    const fields = ['name', 'description', 'location', 'status', 'projectType', 'startDate', 'expectedCompletionDate', 'budget', 'internalRef', 'progress', 'projectManagerId'];
    fields.forEach(f => { if (req.body[f] !== undefined) project[f] = req.body[f]; });
    if (req.file) project.coverImage = `/uploads/project-covers/${req.file.filename}`;
    await project.save();

    await ProjectActivity.create({
      projectId: project.id,
      actorId: req.user.id,
      action: 'project_updated',
      detail: `Project details updated`,
      refType: 'project',
      refId: project.id
    });

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/projects/:id — soft delete ──
router.delete('/:id', protect, restrictTo(...SUPER_ROLES), async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    project.isDeleted = true;
    await project.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════
// ── SUB-RESOURCE ROUTES FOR PROJECT WORKSPACE ──
// ══════════════════════════════════════════════════════════════

// ── TASKS ──
router.get('/:id/tasks', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const tasks = await ProjectTask.findAll({
      where: { projectId: req.params.id, isDeleted: false },
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'fullName', 'role'] },
        { model: ProjectTaskComment, as: 'Comments', attributes: ['id'] }
      ],
      order: [['createdAt', 'ASC']]
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/tasks', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const { title, description, priority, status, dueDate, isMilestone, assignedTo, parentId, isFolder, category } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    const task = await ProjectTask.create({
      projectId: req.params.id,
      title: title.trim(),
      description: description || null,
      priority: priority || 'Medium',
      status: status || 'To Do',
      dueDate: dueDate || null,
      isMilestone: isMilestone === true || isMilestone === 'true',
      assignedTo: assignedTo ? parseInt(assignedTo) : null,
      parentId: parentId ? parseInt(parentId) : null,
      isFolder: isFolder === true || isFolder === 'true',
      category: category || 'General',
      createdBy: req.user.id
    });

    await ProjectActivity.create({
      projectId: req.params.id,
      actorId: req.user.id,
      action: 'task_created',
      detail: `${isFolder ? 'Folder / Work Package' : 'Task'} "${title.trim()}" created`,
      refType: 'task',
      refId: task.id
    });

    const fullTask = await ProjectTask.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'fullName', 'role'] },
        { model: ProjectTaskComment, as: 'Comments', attributes: ['id'] }
      ]
    });

    const recipients = assignedTo ? [parseInt(assignedTo)] : await getProjectMemberIds(req.params.id);
    sendProjectNotification(req.app, req.params.id, recipients, {
      senderId: req.user.id,
      title: isFolder ? 'New Project Phase Created' : (assignedTo ? 'New Task Assigned to You' : 'New Task Created'),
      message: `${req.user.fullName} added: "${title.trim()}"`,
      action: 'task_created',
      tab: 'tasks'
    });

    res.status(201).json(fullTask || task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/tasks/:taskId', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const task = await ProjectTask.findOne({
      where: { id: req.params.taskId, projectId: req.params.id, isDeleted: false }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const fields = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'isMilestone', 'parentId', 'isFolder', 'category'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        if (f === 'assignedTo' || f === 'parentId') {
          task[f] = req.body[f] ? parseInt(req.body[f]) : null;
        } else if (f === 'isMilestone' || f === 'isFolder') {
          task[f] = req.body[f] === true || req.body[f] === 'true';
        } else {
          task[f] = req.body[f];
        }
      }
    });
    await task.save();

    if (req.body.status) {
      await ProjectActivity.create({
        projectId: req.params.id,
        actorId: req.user.id,
        action: 'status_changed',
        detail: `Task "${task.title}" status changed to ${task.status}`,
        refType: 'task',
        refId: task.id
      });
    }

    const fullTask = await ProjectTask.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'fullName', 'role'] },
        { model: ProjectTaskComment, as: 'Comments', attributes: ['id'] }
      ]
    });

    if (req.body.status) {
      sendProjectNotification(req.app, req.params.id, [task.assignedTo, task.createdBy], {
        senderId: req.user.id,
        title: `Task Status: "${task.title}"`,
        message: `${req.user.fullName} changed status to ${task.status}`,
        action: 'status_changed',
        tab: 'tasks'
      });
    }

    res.json(fullTask || task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/tasks/:taskId', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access || !['Project Admin', 'Editor'].includes(access)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const task = await ProjectTask.findOne({
      where: { id: req.params.taskId, projectId: req.params.id }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.isDeleted = true;
    await task.save();

    // Also soft-delete any child subtasks
    await ProjectTask.update({ isDeleted: true }, {
      where: { parentId: req.params.taskId, projectId: req.params.id }
    });

    await ProjectActivity.create({
      projectId: req.params.id,
      actorId: req.user.id,
      action: 'task_deleted',
      detail: `Task "${task.title}" deleted`,
      refType: 'task',
      refId: task.id
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── TASK COMMENTS / CHATBOX ──
router.get('/:id/tasks/:taskId/comments', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const comments = await ProjectTaskComment.findAll({
      where: { taskId: req.params.taskId, projectId: req.params.id },
      include: [{ model: User, as: 'Sender', attributes: ['id', 'fullName', 'role'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/tasks/:taskId/comments', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Comment message is required' });
    }
    const comment = await ProjectTaskComment.create({
      taskId: req.params.taskId,
      projectId: req.params.id,
      senderId: req.user.id,
      message: message.trim()
    });

    const fullComment = await ProjectTaskComment.findByPk(comment.id, {
      include: [{ model: User, as: 'Sender', attributes: ['id', 'fullName', 'role'] }]
    });

    const task = await ProjectTask.findByPk(req.params.taskId);
    if (task) {
      const rec = [task.assignedTo, task.createdBy];
      sendProjectNotification(req.app, req.params.id, rec, {
        senderId: req.user.id,
        title: `Task Discussion: "${task.title}"`,
        message: `${req.user.fullName}: "${message.trim()}"`,
        action: 'task_comment',
        tab: 'tasks'
      });
    }

    res.status(201).json(fullComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── TASK FORWARD / ASSIGN ──
router.post('/:id/tasks/:taskId/forward', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const task = await ProjectTask.findOne({ where: { id: req.params.taskId, projectId: req.params.id, isDeleted: false } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { assignedTo, note } = req.body;
    if (!assignedTo) return res.status(400).json({ error: 'Target assignee is required' });

    const newAssignee = await User.findByPk(assignedTo);
    const assigneeName = newAssignee ? newAssignee.fullName : `User #${assignedTo}`;

    task.assignedTo = parseInt(assignedTo);
    await task.save();

    await ProjectActivity.create({
      projectId: req.params.id,
      actorId: req.user.id,
      action: 'task_forwarded',
      detail: `Task "${task.title}" assigned / forwarded to ${assigneeName}${note ? ': ' + note : ''}`,
      refType: 'task',
      refId: task.id
    });

    await ProjectTaskComment.create({
      taskId: task.id,
      projectId: req.params.id,
      senderId: req.user.id,
      message: `➡️ Task assigned / forwarded to ${assigneeName}${note ? ' — Note: ' + note : ''}`
    });

    const fullTask = await ProjectTask.findByPk(task.id, {
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'fullName', 'role'] },
        { model: ProjectTaskComment, as: 'Comments', attributes: ['id'] }
      ]
    });

    sendProjectNotification(req.app, req.params.id, [parseInt(assignedTo)], {
      senderId: req.user.id,
      title: `Task Forwarded to You`,
      message: `Task "${task.title}" assigned to you by ${req.user.fullName}${note ? ': ' + note : ''}`,
      action: 'task_forwarded',
      tab: 'tasks'
    });

    res.json(fullTask || task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── TASK FILES / ATTACHMENTS ──
router.get('/:id/tasks/:taskId/files', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const files = await ProjectFile.findAll({
      where: { projectId: req.params.id, taskId: req.params.taskId, isDeleted: false },
      include: [{ model: User, as: 'Uploader', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/tasks/:taskId/files', protect, uploadFile.single('file'), async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const task = await ProjectTask.findOne({ where: { id: req.params.taskId, projectId: req.params.id, isDeleted: false } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { description } = req.body;
    const file = await ProjectFile.create({
      projectId: req.params.id,
      taskId: task.id,
      folderId: null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/project-files/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      description: description || null,
      category: 'Task Attachment',
      uploadedBy: req.user.id
    });

    await ProjectActivity.create({
      projectId: req.params.id,
      actorId: req.user.id,
      action: 'task_file_uploaded',
      detail: `Attached "${req.file.originalname}" to task "${task.title}"`,
      refType: 'task',
      refId: task.id
    });

    await ProjectTaskComment.create({
      taskId: task.id,
      projectId: req.params.id,
      senderId: req.user.id,
      message: `📎 Uploaded attachment: ${req.file.originalname}`
    });

    sendProjectNotification(req.app, req.params.id, [task.assignedTo, task.createdBy], {
      senderId: req.user.id,
      title: `File Attached to "${task.title}"`,
      message: `${req.user.fullName} uploaded: ${req.file.originalname}`,
      action: 'task_file_uploaded',
      tab: 'files'
    });

    const fullFile = await ProjectFile.findByPk(file.id, {
      include: [{ model: User, as: 'Uploader', attributes: ['id', 'fullName'] }]
    });

    res.status(201).json(fullFile || file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── TASK TRACKING / HISTORY ──
router.get('/:id/tasks/:taskId/history', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const history = await ProjectActivity.findAll({
      where: { projectId: req.params.id, refType: 'task', refId: req.params.taskId },
      order: [['createdAt', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── LICENCES ──
router.get('/:id/licences', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const licences = await ProjectLicence.findAll({
      where: { projectId: req.params.id, isArchived: false },
      order: [['createdAt', 'DESC']]
    });
    res.json(licences);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/licences', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const { name, category, status, issuingAuthority, issueDate, expiryDate, licenceNumber, notes, responsiblePersonId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Licence name is required' });

    const licence = await ProjectLicence.create({
      projectId: req.params.id,
      name: name.trim(),
      category: category || null,
      status: status || 'Valid',
      issuingAuthority: issuingAuthority || null,
      issueDate: issueDate || null,
      expiryDate: expiryDate || null,
      licenceNumber: licenceNumber || null,
      notes: notes || null,
      responsiblePersonId: responsiblePersonId ? parseInt(responsiblePersonId) : null,
      createdBy: req.user.id
    });

    await ProjectActivity.create({
      projectId: req.params.id,
      actorId: req.user.id,
      action: 'licence_added',
      detail: `Licence "${name.trim()}" added`,
      refType: 'licence',
      refId: licence.id
    });

    res.status(201).json(licence);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/licences/:licenceId', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const licence = await ProjectLicence.findOne({
      where: { id: req.params.licenceId, projectId: req.params.id, isArchived: false }
    });
    if (!licence) return res.status(404).json({ error: 'Licence not found' });
    const fields = ['name', 'category', 'status', 'issuingAuthority', 'issueDate', 'expiryDate', 'licenceNumber', 'notes', 'responsiblePersonId'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) licence[f] = req.body[f];
    });
    licence.updatedBy = req.user.id;
    await licence.save();
    res.json(licence);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/licences/:licenceId', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access || !['Project Admin', 'Editor'].includes(access)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const licence = await ProjectLicence.findOne({
      where: { id: req.params.licenceId, projectId: req.params.id }
    });
    if (!licence) return res.status(404).json({ error: 'Licence not found' });
    licence.isArchived = true;
    licence.updatedBy = req.user.id;
    await licence.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DISCUSSIONS ──
router.get('/:id/discussions', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const discussions = await ProjectDiscussion.findAll({
      where: { projectId: req.params.id, isDeleted: false },
      include: [{ model: User, as: 'Sender', attributes: ['id', 'fullName', 'role'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json(discussions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/discussions', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const { message, parentId } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const discussion = await ProjectDiscussion.create({
      projectId: req.params.id,
      parentId: parentId || null,
      message: message.trim(),
      senderId: req.user.id
    });

    const full = await ProjectDiscussion.findByPk(discussion.id, {
      include: [{ model: User, as: 'Sender', attributes: ['id', 'fullName', 'role'] }]
    });

    const memberIds = await getProjectMemberIds(req.params.id);
    const proj = await Project.findByPk(req.params.id);
    sendProjectNotification(req.app, req.params.id, memberIds, {
      senderId: req.user.id,
      title: `Discussion in ${proj ? proj.name : 'Project'}`,
      message: `${req.user.fullName}: "${message.trim()}"`,
      action: 'discussion_message',
      tab: 'discussions'
    });

    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── FOLDERS ──
router.get('/:id/folders', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const folders = await ProjectFolder.findAll({
      where: { projectId: req.params.id },
      order: [['name', 'ASC']]
    });
    res.json(folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/folders', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name is required' });

    const folder = await ProjectFolder.create({
      projectId: req.params.id,
      name: name.trim(),
      parentId: null,
      isDefault: false,
      createdBy: req.user.id
    });
    res.status(201).json(folder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── FILES ──
router.get('/:id/files', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const where = { projectId: req.params.id, isDeleted: false };
    if (req.query.folderId) {
      where.folderId = req.query.folderId;
    }
    const files = await ProjectFile.findAll({
      where,
      include: [{ model: User, as: 'Uploader', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/files', protect, uploadFile.single('file'), async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { folderId, description, category } = req.body;
    const file = await ProjectFile.create({
      projectId: req.params.id,
      folderId: folderId ? parseInt(folderId) : null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/project-files/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      description: description || null,
      category: category || null,
      uploadedBy: req.user.id
    });

    await ProjectActivity.create({
      projectId: req.params.id,
      actorId: req.user.id,
      action: 'file_uploaded',
      detail: `File "${req.file.originalname}" uploaded`,
      refType: 'file',
      refId: file.id
    });

    res.status(201).json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ACTIVITY ──
router.get('/:id/activity', protect, async (req, res) => {
  try {
    const access = await getProjectAccess(req.params.id, req.user.id, req.user.role);
    if (!access) return res.status(403).json({ error: 'Access denied' });
    const acts = await ProjectActivity.findAll({
      where: { projectId: req.params.id },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(acts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
