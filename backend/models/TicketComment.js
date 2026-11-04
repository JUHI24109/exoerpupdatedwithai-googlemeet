const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TicketComment = sequelize.define('TicketComment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: false },
}, {
  timestamps: true,
  indexes: [{ fields: ['ticketId'] }]
});

module.exports = TicketComment;
