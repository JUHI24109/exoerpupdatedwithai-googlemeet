const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  employeeId: { type: DataTypes.STRING, unique: true, allowNull: false },
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('Chairman', 'CEO', 'IT Admin', 'HR', 'Level 3', 'Level 4', 'Level 5', 'Employee'), 
    defaultValue: 'Employee' 
  },
  department: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  whatsappNumber: { type: DataTypes.STRING },
  dob: { type: DataTypes.DATEONLY },
  placeOfBirth: { type: DataTypes.STRING },
  bloodGroup: { type: DataTypes.STRING },
  medicalIssues: { type: DataTypes.TEXT },
  qualification: { type: DataTypes.STRING },
  passportNumber: { type: DataTypes.STRING },
  nif: { type: DataTypes.STRING },
  niss: { type: DataTypes.STRING },
  sns: { type: DataTypes.STRING },
  residentialDocId: { type: DataTypes.STRING },
  iban: { type: DataTypes.STRING },
  permanentAddress: { type: DataTypes.TEXT },
  currentAddress: { type: DataTypes.TEXT },
  calendarEmail: { type: DataTypes.STRING },
  calendarProvider: { type: DataTypes.STRING },
  calendarAccessToken: { type: DataTypes.TEXT },
  calendarRefreshToken: { type: DataTypes.TEXT },
  joiningDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  designation: { type: DataTypes.STRING },
  profilePic: { type: DataTypes.STRING },
  otpCode: { type: DataTypes.STRING },
  otpExpiry: { type: DataTypes.DATE },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  timestamps: true
});

module.exports = User;

