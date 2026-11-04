const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectDiscussion = sequelize.define('ProjectDiscussion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  parentId: { type: DataTypes.INTEGER, defaultValue: null }, // null = top-level, otherwise = reply
  message: { type: DataTypes.TEXT, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
  isEdited: { type: DataTypes.BOOLEAN, defaultValue: false },
  attachmentUrl: { type: DataTypes.STRING },
  attachmentName: { type: DataTypes.STRING },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  timestamps: true,
  indexes: [
    { fields: ['projectId'] },
    { fields: ['senderId'] }
  ]
});

module.exports = ProjectDiscussion;
