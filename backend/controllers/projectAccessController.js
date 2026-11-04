const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const User = require('../models/User');
const { Op } = require('sequelize');

// Helper to check if requester can manage this project
async function canManageProject(req, projectId) {
  // Super roles
  const superRoles = ['Chairman', 'CEO', 'IT Admin'];
  if (superRoles.includes(req.user.role)) return true;
  // Check if user is Project Admin for this project
  const member = await ProjectMember.findOne({
    where: { projectId, userId: req.user.id, role: 'Project Admin' }
  });
  return !!member;
}

// List members of a project with their permission levels
exports.getProjectMembers = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Authorization: Project Admins/super roles can manage; any project member can view the list
    const superRoles = ['Chairman', 'CEO', 'IT Admin'];
    const isSuper = superRoles.includes(req.user.role);
    const membership = await ProjectMember.findOne({ where: { projectId, userId: req.user.id } });
    if (!isSuper && !membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await ProjectMember.findAll({
      where: { projectId },
      include: [{ model: User, attributes: ['id', 'fullName', 'email', 'role'] }]
    });
    res.json({ projectId, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Grant access to a user for a project
exports.grantProjectAccess = async (req, res) => {
  const { projectId } = req.params;
  const { userId, role } = req.body; // role must be one of defined levels
  const allowedRoles = ['Project Admin', 'Editor', 'Contributor', 'Viewer'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!(await canManageProject(req, projectId))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    // Ensure user exists
    const targetUser = await User.findByPk(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    // Upsert member record
    const [member, created] = await ProjectMember.upsert({
      projectId,
      userId,
      role,
      grantedBy: req.user.id,
      grantedAt: new Date()
    }, { returning: true });
    // Ensure creator remains Project Admin (prevent removal later)
    res.json({ success: true, created, member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Revoke access from a user for a project
exports.revokeProjectAccess = async (req, res) => {
  const { projectId } = req.params;
  const { userId } = req.body;
  try {
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!(await canManageProject(req, projectId))) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    // Prevent revoking own admin rights if last admin
    const targetMember = await ProjectMember.findOne({ where: { projectId, userId } });
    if (!targetMember) return res.status(404).json({ error: 'Member not found' });
    // If trying to revoke a Project Admin, ensure there is at least one other admin
    if (targetMember.role === 'Project Admin') {
      const adminCount = await ProjectMember.count({ where: { projectId, role: 'Project Admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot revoke the last Project Admin' });
      }
    }
    await targetMember.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
