const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectFileVersion = sequelize.define('ProjectFileVersion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fileId: { type: DataTypes.INTEGER, allowNull: false },
  version: { type: DataTypes.INTEGER, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false },
  fileSize: { type: DataTypes.INTEGER },
  uploadedBy: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.TEXT }
}, {
  timestamps: true
});

module.exports = ProjectFileVersion;
