const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectFile = sequelize.define('ProjectFile', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  taskId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  folderId: { type: DataTypes.INTEGER, allowNull: true }, // null = root
  fileName: { type: DataTypes.STRING, allowNull: false },
  originalName: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false },
  fileType: { type: DataTypes.STRING },
  fileSize: { type: DataTypes.INTEGER }, // bytes
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  uploadedBy: { type: DataTypes.INTEGER, allowNull: false },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  timestamps: true,
  indexes: [
    { fields: ['projectId'] },
    { fields: ['folderId'] },
    { fields: ['uploadedBy'] }
  ]
});

module.exports = ProjectFile;
