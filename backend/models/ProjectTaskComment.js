const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectTaskComment = sequelize.define('ProjectTaskComment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  attachmentUrl: { type: DataTypes.STRING, allowNull: true },
  attachmentName: { type: DataTypes.STRING, allowNull: true }
}, {
  timestamps: true,
  indexes: [{ fields: ['taskId'] }]
});

module.exports = ProjectTaskComment;

