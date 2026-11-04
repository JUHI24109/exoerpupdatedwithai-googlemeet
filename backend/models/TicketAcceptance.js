const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TicketAcceptance = sequelize.define('TicketAcceptance', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Accepted'), defaultValue: 'Pending' }
}, {
  timestamps: true
});

module.exports = TicketAcceptance;
