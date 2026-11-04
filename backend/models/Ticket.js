const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.STRING, unique: true, allowNull: false }, // e.g. TICKET-1001
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { 
    type: DataTypes.ENUM('Raised', 'Working', 'Assigned', 'Completed'), 
    defaultValue: 'Raised' 
  },
  priority: { 
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), 
    defaultValue: 'Medium' 
  },
  creatorId: { type: DataTypes.INTEGER, allowNull: false }, // User who raised it
  currentAssigneeId: { type: DataTypes.INTEGER, allowNull: false }, // Current holder
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  timestamps: true,
  indexes: [
    { fields: ['creatorId'] },
    { fields: ['currentAssigneeId'] },
    { fields: ['status', 'isDeleted'] },
    { fields: ['priority'] },
    { fields: ['ticketId'], unique: true }
  ]
});

module.exports = Ticket;
