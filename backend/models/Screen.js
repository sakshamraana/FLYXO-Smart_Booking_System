const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Screen = sequelize.define('Screen', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  theatreId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  screenNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  screenType: {
    type: DataTypes.ENUM('STANDARD', 'IMAX', 'FOUR_DX', 'PREMIUM'),
    defaultValue: 'STANDARD',
  },
  totalSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  tableName: 'screens',
});

module.exports = Screen;
