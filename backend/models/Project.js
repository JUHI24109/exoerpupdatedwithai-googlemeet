const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.STRING, unique: true, allowNull: false }, // e.g. PRJ-1001
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  location: { type: DataTypes.STRING },
  status: { 
    type: DataTypes.STRING,
    defaultValue: 'Active',
    // Active, On Hold, Completed, Archived
  },
  projectType: { type: DataTypes.STRING }, // Residential, Commercial, Mixed-Use, etc.
  coverImage: { type: DataTypes.STRING },
  startDate: { type: DataTypes.DATEONLY },
  expectedCompletionDate: { type: DataTypes.DATEONLY },
  budget: { type: DataTypes.STRING },
  internalRef: { type: DataTypes.STRING },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 }, // 0-100
  creatorId: { type: DataTypes.INTEGER, allowNull: false },
  projectManagerId: { type: DataTypes.INTEGER },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  timestamps: true
});

module.exports = Project;
