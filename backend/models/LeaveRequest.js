const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: false },
  endDate: { type: DataTypes.DATEONLY, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { 
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Hold'), 
    defaultValue: 'Pending' 
  },
  hrStatus: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Hold'),
    defaultValue: 'Pending'
  },
  ceoStatus: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Hold', 'N/A'),
    defaultValue: 'Pending'
  },
  type: {
    type: DataTypes.ENUM('Sick Leave', 'Casual Leave', 'Paid Leave', 'Unpaid Leave', 'Holiday'),
    defaultValue: 'Casual Leave'
  },
  approvedById: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true
});

LeaveRequest.belongsTo(User, { as: 'Employee', foreignKey: 'userId' });
LeaveRequest.belongsTo(User, { as: 'Approver', foreignKey: 'approvedById' });

module.exports = LeaveRequest;
