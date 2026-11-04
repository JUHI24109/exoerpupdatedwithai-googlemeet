const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectTask = sequelize.define('ProjectTask', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'To Do',
    // To Do, In Progress, Blocked, Completed
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Medium',
    // Low, Medium, High, Critical
  },
  assignedTo: { type: DataTypes.INTEGER },
  parentId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  category: { type: DataTypes.STRING, defaultValue: 'General' },
  isFolder: { type: DataTypes.BOOLEAN, defaultValue: false },
  dueDate: { type: DataTypes.DATEONLY },
  isMilestone: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  timestamps: true,
  indexes: [
    { fields: ['projectId', 'isDeleted'] },
    { fields: ['assignedTo'] },
    { fields: ['parentId'] },
    { fields: ['status'] }
  ]
});

module.exports = ProjectTask;
