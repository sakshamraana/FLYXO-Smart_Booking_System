const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  showId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seats: {
    type: DataTypes.TEXT, // Stored as JSON string of seat numbers e.g. ["A1", "A2"]
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  bookingReference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  idProofType: {
    type: DataTypes.STRING, // AADHAR, PAN, DRIVING_LICENSE, PASSPORT
    allowNull: false,
  },
  idProofNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
    defaultValue: 'PENDING',
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'),
    defaultValue: 'PENDING',
  },
  stripeSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'bookings',
});

module.exports = Booking;
