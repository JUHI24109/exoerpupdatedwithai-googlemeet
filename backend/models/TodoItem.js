const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TodoItem = sequelize.define('TodoItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },

  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },

  dueDate: { type: DataTypes.DATEONLY },
  reminderMonth: { type: DataTypes.STRING }, // YYYY-MM
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  isDone: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  timestamps: true
});

module.exports = TodoItem;
