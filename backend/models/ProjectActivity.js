const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectActivity = sequelize.define('ProjectActivity', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  actorId: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING, allowNull: false }, // e.g. 'file_uploaded', 'status_changed', etc.
  detail: { type: DataTypes.TEXT }, // human-readable description
  refType: { type: DataTypes.STRING }, // 'file', 'licence', 'task', 'discussion', 'project', 'member'
  refId: { type: DataTypes.INTEGER }, // ID of the related record
  isAudit: { type: DataTypes.BOOLEAN, defaultValue: false } // true = security-sensitive, immutable
}, {
  timestamps: true,
  indexes: [{ fields: ['projectId'] }]
});

module.exports = ProjectActivity;
