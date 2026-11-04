const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Ticket = require('./Ticket');

const TicketShare = sequelize.define('TicketShare', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }, // Person it's shared with
  permissionLevel: { 
    type: DataTypes.ENUM('View', 'Edit', 'Full'), 
    defaultValue: 'View' 
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['ticketId'] },
    { fields: ['userId'] }
  ]
});

module.exports = TicketShare;
