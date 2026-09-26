const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Show = sequelize.define('Show', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  theatreId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  screenId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  showDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  showTime: {
    type: DataTypes.STRING, // e.g. "14:30", "18:00"
    allowNull: false,
  },
  screen: {
    type: DataTypes.STRING, // e.g. "Screen 1"
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'English',
  },
  format: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '2D',
  },
  totalSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  availableSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'shows',
});

module.exports = Show;
