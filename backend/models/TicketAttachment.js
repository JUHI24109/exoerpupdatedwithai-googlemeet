const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TicketAttachment = sequelize.define('TicketAttachment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ticketId: { type: DataTypes.INTEGER, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false },
  fileUrl: { type: DataTypes.STRING, allowNull: false },
  fileType: { type: DataTypes.STRING },
  userId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: true,
  indexes: [{ fields: ['ticketId'] }]
});

module.exports = TicketAttachment;
