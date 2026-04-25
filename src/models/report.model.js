const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cases: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT
    },
    latitude: {
        type: DataTypes.FLOAT
    },
    longitude: {
        type: DataTypes.FLOAT
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
    timestamps: true,
    paranoid: true // enables soft delete
});

module.exports = Report;