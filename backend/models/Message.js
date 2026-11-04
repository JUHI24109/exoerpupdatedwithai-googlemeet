const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  content: { type: DataTypes.TEXT },
   fileUrl: { type: DataTypes.STRING },
   fileType: { type: DataTypes.STRING },
   fileName: { type: DataTypes.STRING },
   senderId: { type: DataTypes.STRING }, // Employee ID
   receiverId: { type: DataTypes.STRING }, // Employee ID or Group ID
   isRead: { type: DataTypes.BOOLEAN, defaultValue: false } // Seen status
}, {
  timestamps: true,
  indexes: [
    { fields: ['senderId', 'receiverId'] },
    { fields: ['receiverId', 'isRead'] }
  ]
});

module.exports = Message;


