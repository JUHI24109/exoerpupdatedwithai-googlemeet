// analyticsController.js
// Provides per‑user ticket analytics for executives and employees.
// Uses the existing Ticket model.

const Ticket = require('../models/Ticket');
const { Op } = require('sequelize');

/**
 * Get personal ticket statistics for the logged‑in user.
 * Returns an object with counts for tickets raised by the user and tickets assigned to the user,
 * broken down by status.
 */
async function getPersonalAnalytics(req, res) {
  try {
    const userId = req.user.id;
    // Helper to aggregate counts by status
    const aggregate = async (whereClause) => {
      const rows = await Ticket.findAll({
        attributes: ['status', [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('status')), 'count']],
        where: whereClause,
        group: ['status']
      });
      const result = {};
      rows.forEach(r => {
        result[r.status] = parseInt(r.get('count'), 10);
      });
      return result;
    };

    const raised = await aggregate({ creatorId: userId, isDeleted: false });
    const assigned = await aggregate({ currentAssigneeId: userId, isDeleted: false });

    // Total counts (including statuses not present will be undefined, we set 0)
    const allStatuses = ['Raised', 'Working', 'Assigned', 'Completed', 'Rejected', 'Overdue'];
    const normalize = (obj) => {
      const out = {};
      allStatuses.forEach(s => { out[s] = obj[s] || 0; });
      out.total = Object.values(out).reduce((a, b) => a + b, 0);
      return out;
    };

    res.json({
      raised: normalize(raised),
      assigned: normalize(assigned)
    });
  } catch (err) {
    console.error('Analytics error', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getPersonalAnalytics };
