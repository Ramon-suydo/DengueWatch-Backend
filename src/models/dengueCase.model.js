const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DengueCase = sequelize.define('DengueCase', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cases: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    deaths: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    region: {
        type: DataTypes.STRING,
        allowNull: true
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: true,
    paranoid: true
});

module.exports = DengueCase;