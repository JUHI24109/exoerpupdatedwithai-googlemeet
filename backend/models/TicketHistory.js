const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TicketHistory = sequelize.define('TicketHistory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING, allowNull: false }, // e.g. 'Status Changed', 'Assigned To', 'Created'
  details: { type: DataTypes.TEXT },
  userId: { type: DataTypes.INTEGER, allowNull: false }, // User who took the action
}, {
  timestamps: true,
  indexes: [{ fields: ['ticketId'] }]
});

module.exports = TicketHistory;
