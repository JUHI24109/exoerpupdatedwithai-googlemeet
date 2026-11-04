const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectFolder = sequelize.define('ProjectFolder', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  parentId: { type: DataTypes.INTEGER, defaultValue: null }, // null = root folder
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdBy: { type: DataTypes.INTEGER, allowNull: false }
}, {
  timestamps: true
});

module.exports = ProjectFolder;
