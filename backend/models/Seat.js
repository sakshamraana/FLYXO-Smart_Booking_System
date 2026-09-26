const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seat = sequelize.define('Seat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  screenId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seatNumber: {
    type: DataTypes.STRING, // e.g. "A1", "A2", "B5"
    allowNull: false,
  },
  row: {
    type: DataTypes.STRING, // e.g. "A", "B", "C"
    allowNull: false,
  },
  seatType: {
    type: DataTypes.ENUM('REGULAR', 'PREMIUM', 'RECLINER'),
    defaultValue: 'REGULAR',
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 200.0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'seats',
});

module.exports = Seat;
