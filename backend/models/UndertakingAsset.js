const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UndertakingAsset = sequelize.define('UndertakingAsset', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  employeeId: { type: DataTypes.STRING, allowNull: false },
  employeeName: { type: DataTypes.STRING, allowNull: false },
  company: { type: DataTypes.STRING, allowNull: false },

  category: {
    type: DataTypes.ENUM('Mobile', 'Laptop', 'Fuel Card', 'Vendor Device', 'Other', 'Via Verde'),
    allowNull: false
  },

  makeModel: { type: DataTypes.STRING },
  mobileNumber: { type: DataTypes.STRING },
  pin: { type: DataTypes.STRING },
  puk: { type: DataTypes.STRING },
  cardNumber: { type: DataTypes.STRING },
  expiryDate: { type: DataTypes.DATEONLY },
  carRegistrationNumber: { type: DataTypes.STRING },
  cardPin: { type: DataTypes.STRING },
  imei1: { type: DataTypes.STRING },
  imei2: { type: DataTypes.STRING },
  serialNumber: { type: DataTypes.STRING },
  serialNumberId: { type: DataTypes.STRING },
  barcodeNo: { type: DataTypes.STRING },
  productIdModelNumber: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },

  receivingDate: { type: DataTypes.DATEONLY, allowNull: false },
  returnDate: { type: DataTypes.DATEONLY },

  notes: { type: DataTypes.TEXT },

  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  updatedBy: { type: DataTypes.INTEGER, allowNull: false }
}, {
  timestamps: true
});

module.exports = UndertakingAsset;
