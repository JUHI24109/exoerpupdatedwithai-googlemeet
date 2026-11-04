const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GroupMember = sequelize.define('GroupMember', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING, // Employee ID
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('Admin', 'Member'),
        defaultValue: 'Member'
    }
}, {
    timestamps: true
});

module.exports = GroupMember;
