const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  taskId: { type: DataTypes.STRING, unique: true }, // e.g. EXO-TKT-2601
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  priority: { type: DataTypes.ENUM('Critical', 'High', 'Medium', 'Low'), defaultValue: 'Medium' },
  status: { type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'On Hold'), defaultValue: 'Pending' },
  deadline: { type: DataTypes.DATE }
}, {
  timestamps: true
});

Task.belongsTo(User, { as: 'Assignee', foreignKey: 'assignedTo' });
Task.belongsTo(User, { as: 'Creator', foreignKey: 'assignedBy' });

module.exports = Task;

