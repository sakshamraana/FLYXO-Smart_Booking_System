const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stripeSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR',
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'),
    defaultValue: 'PENDING',
  },
}, {
  timestamps: true,
  tableName: 'payments',
});

module.exports = Payment;
