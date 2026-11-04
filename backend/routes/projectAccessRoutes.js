const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :projectId
const { protect } = require('../middleware/authMiddleware');
const projectAccessController = require('../controllers/projectAccessController');

// All routes are protected
router.use(protect);

// GET /api/projects/:projectId/access/members – list members
router.get('/members', projectAccessController.getProjectMembers);

// POST /api/projects/:projectId/access/grant – grant access
router.post('/grant', projectAccessController.grantProjectAccess);

// POST /api/projects/:projectId/access/revoke – revoke access
router.post('/revoke', projectAccessController.revokeProjectAccess);

module.exports = router;
