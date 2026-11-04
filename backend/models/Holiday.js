const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Holiday = sequelize.define('Holiday', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('Public', 'Company'), defaultValue: 'Public' }
});

module.exports = Holiday;
