const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { 
    type: DataTypes.STRING, // e.g., 'TICKET', 'LEAVE', 'SYSTEM', 'CHAT'
    defaultValue: 'SYSTEM'
  },
  relatedId: { type: DataTypes.STRING, allowNull: true }, // e.g., Ticket ID or Leave ID
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isRead'] },
    { fields: ['userId', 'type', 'isRead'] },
    { fields: ['type'] }
  ]
});

Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = Notification;
