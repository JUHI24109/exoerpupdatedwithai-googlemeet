const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EmployeeDocument = sequelize.define('EmployeeDocument', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  employeeId: { type: DataTypes.STRING, allowNull: false },
  employeeName: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING },
  designation: { type: DataTypes.STRING },

  docTitle: { type: DataTypes.STRING, allowNull: false },
  docType: { type: DataTypes.STRING, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false },

  uploadedBy: { type: DataTypes.INTEGER, allowNull: false },
  updatedBy: { type: DataTypes.INTEGER, allowNull: false },
  
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  folder: { type: DataTypes.STRING, defaultValue: 'root' }
}, {
  timestamps: true
});

module.exports = EmployeeDocument;
