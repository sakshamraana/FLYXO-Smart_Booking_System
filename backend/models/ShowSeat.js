const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShowSeat = sequelize.define('ShowSeat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  showId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seatId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'LOCKED', 'BOOKED'),
    defaultValue: 'AVAILABLE',
  },
  lockedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  lockedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'show_seats',
  indexes: [
    {
      unique: true,
      fields: ['showId', 'seatId'],
    },
  ],
});

module.exports = ShowSeat;
