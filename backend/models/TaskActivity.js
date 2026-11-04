const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Task = require('./Task');

const TaskActivity = sequelize.define('TaskActivity', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  action: { type: DataTypes.STRING, allowNull: false }, // 'Created', 'Forwarded', 'Uploaded File', 'Status Changed', 'Verified'
  description: { type: DataTypes.TEXT },
  fileUrl: { type: DataTypes.STRING }, // If action is upload
}, {
  timestamps: true
});

TaskActivity.belongsTo(Task, { foreignKey: 'taskId', onDelete: 'CASCADE' });
TaskActivity.belongsTo(User, { as: 'Actor', foreignKey: 'userId' }); // Who performed the action
TaskActivity.belongsTo(User, { as: 'Target', foreignKey: 'targetUserId', allowNull: true }); // Whom it was forwarded/assigned to

module.exports = TaskActivity;
