const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Reminder = sequelize.define('Reminder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reminderDateTime: {
    type: DataTypes.DATE, // Stores both date and time
    allowNull: false,
  },
  isDismissed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  targetRoles: {
    type: DataTypes.JSON, // e.g., ["CEO","Chairman"]
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Reminder;