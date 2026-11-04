const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectLicence = sequelize.define('ProjectLicence', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING },
  issuingAuthority: { type: DataTypes.STRING },
  licenceNumber: { type: DataTypes.STRING },
  issueDate: { type: DataTypes.DATEONLY },
  expiryDate: { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Valid',
    // Valid, Pending, Expiring Soon, Expired, Renewal In Progress
  },
  responsiblePersonId: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  relatedFileUrl: { type: DataTypes.STRING },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  updatedBy: { type: DataTypes.INTEGER },
  isArchived: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  timestamps: true
});

module.exports = ProjectLicence;
