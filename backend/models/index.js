const sequelize = require('../config/database');
const User = require('./User');
const Movie = require('./Movie');
const Theatre = require('./Theatre');
const Screen = require('./Screen');
const Seat = require('./Seat');
const Show = require('./Show');
const ShowSeat = require('./ShowSeat');
const Booking = require('./Booking');
const Payment = require('./Payment');

// Theatre & Screen & User Relationships
Theatre.hasMany(Screen, { foreignKey: 'theatreId', as: 'screens', onDelete: 'CASCADE' });
Screen.belongsTo(Theatre, { foreignKey: 'theatreId', as: 'theatre' });

Theatre.hasMany(User, { foreignKey: 'theatreId', as: 'admins' });
User.belongsTo(Theatre, { foreignKey: 'theatreId', as: 'theatre' });

Theatre.hasMany(Show, { foreignKey: 'theatreId', as: 'shows', onDelete: 'CASCADE' });
Show.belongsTo(Theatre, { foreignKey: 'theatreId', as: 'theatre' });

Screen.hasMany(Seat, { foreignKey: 'screenId', as: 'seats', onDelete: 'CASCADE' });
Seat.belongsTo(Screen, { foreignKey: 'screenId', as: 'screen' });

Screen.hasMany(Show, { foreignKey: 'screenId', as: 'shows' });
Show.belongsTo(Screen, { foreignKey: 'screenId', as: 'screenRef' });

// Movie & Show Relationships
Movie.hasMany(Show, { foreignKey: 'movieId', as: 'shows', onDelete: 'CASCADE' });
Show.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });

// ShowSeat Relationships
Show.hasMany(ShowSeat, { foreignKey: 'showId', as: 'showSeats', onDelete: 'CASCADE' });
ShowSeat.belongsTo(Show, { foreignKey: 'showId', as: 'show' });

Seat.hasMany(ShowSeat, { foreignKey: 'seatId', as: 'showSeats', onDelete: 'CASCADE' });
ShowSeat.belongsTo(Seat, { foreignKey: 'seatId', as: 'seat' });

ShowSeat.belongsTo(User, { foreignKey: 'lockedBy', as: 'locker' });

// Booking Relationships
Show.hasMany(Booking, { foreignKey: 'showId', as: 'bookings' });
Booking.belongsTo(Show, { foreignKey: 'showId', as: 'show' });

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Booking.hasMany(Payment, { foreignKey: 'bookingId', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

module.exports = {
  sequelize,
  User,
  Movie,
  Theatre,
  Screen,
  Seat,
  Show,
  ShowSeat,
  Booking,
  Payment,
};

