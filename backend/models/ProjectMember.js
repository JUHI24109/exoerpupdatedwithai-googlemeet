const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectMember = sequelize.define('ProjectMember', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Viewer',
    // Project Admin, Editor, Contributor, Viewer
  },
  grantedBy: { type: DataTypes.INTEGER, allowNull: false },
  grantedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['projectId', 'userId'] },
    { fields: ['projectId'] },
    { fields: ['userId'] }
  ]
});

module.exports = ProjectMember;
