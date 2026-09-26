const bcrypt = require('bcryptjs');
const { Op, Transaction } = require('sequelize');
const {
  User,
  Movie,
  Theatre,
  Screen,
  Seat,
  Show,
  ShowSeat,
  Booking,
  Payment,
  sequelize,
} = require('../models');
const { generateToken } = require('../utils/jwt');
const { validateIdProof, checkAgeRestriction } = require('../utils/validators');
const {
  lockSeats: lockSeatsUtil,
  releaseSeats: releaseSeatsUtil,
  getShowSeatsFormatted,
} = require('../utils/seatLock');
const stripeService = require('../services/stripeService');
const {
  createBookingCheckoutSession,
  verifyAndRetrievePaymentSession,
} = require('../services/bookingPaymentService');

const checkAuth = (context) => {
  if (!context || !context.user) {
    throw new Error('Authentication required. Please log in.');
  }
  return context.user;
};

const checkAdmin = (context) => {
  const user = checkAuth(context);
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Access denied. Administrator privileges required.');
  }
  return user;
};

const checkSuperAdmin = (context) => {
  const user = checkAuth(context);
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('Access denied. Super Administrator privileges required.');
  }
  return user;
};

const getAdminTheatreId = async (context) => {
  const user = checkAuth(context);
  if (user.role === 'SUPER_ADMIN') return null;
  let userTheatreId = user.theatreId;
  if (userTheatreId === undefined || userTheatreId === null) {
    const dbUser = await User.findByPk(user.id);
    userTheatreId = dbUser ? dbUser.theatreId : null;
  }
  return userTheatreId;
};

const checkTheatreAdmin = async (context, theatreId) => {
  const user = checkAuth(context);
  if (user.role === 'SUPER_ADMIN') {
    return user;
  }
  let userTheatreId = user.theatreId;
  if (userTheatreId === undefined || userTheatreId === null) {
    const dbUser = await User.findByPk(user.id);
    userTheatreId = dbUser ? dbUser.theatreId : null;
  }
  if (!userTheatreId) {
    throw new Error('Access denied. You do not have an assigned theatre.');
  }
  if (user.role === 'ADMIN') {
    if (theatreId && Number(userTheatreId) !== Number(theatreId)) {
      throw new Error(`Access denied. You can only manage your assigned theatre.`);
    }
    return user;
  }
  throw new Error(`Access denied. Administrator privileges required.`);
};

const resolvers = {
  // Queries
  me: async (args, context) => {
    const authUser = checkAuth(context);
    const user = await User.findByPk(authUser.id, {
      include: [{ model: Theatre, as: 'theatre' }],
    });
    return user;
  },

  users: async (args, context) => {
    const authUser = checkAdmin(context);
    const where = {};
    if (authUser.role === 'ADMIN' && authUser.theatreId) {
      where.role = 'USER';
    }
    const users = await User.findAll({
      where,
      include: [{ model: Theatre, as: 'theatre' }],
      order: [['createdAt', 'DESC']],
    });
    return users;
  },

  admins: async (args, context) => {
    checkSuperAdmin(context);
    const admins = await User.findAll({
      where: {
        role: { [Op.in]: ['ADMIN', 'SUPER_ADMIN'] },
      },
      include: [{ model: Theatre, as: 'theatre' }],
      order: [['createdAt', 'DESC']],
    });
    return admins;
  },

  theatres: async ({ city }, context) => {
    const where = {};
    if (city) {
      where.city = city;
    }
    // For non-admin, show only active theatres
    const user = context && context.user;
    if (!user || user.role === 'USER') {
      where.isActive = true;
    }
    const theatres = await Theatre.findAll({
      where,
      include: [
        { model: Screen, as: 'screens', where: { isActive: true }, required: false },
      ],
      order: [['name', 'ASC']],
    });
    return theatres;
  },

  theatre: async ({ id }) => {
    const theatre = await Theatre.findByPk(id, {
      include: [
        { model: Screen, as: 'screens', where: { isActive: true }, required: false },
        { model: Show, as: 'shows', where: { isActive: true }, required: false },
        { model: User, as: 'admins' },
      ],
    });
    if (!theatre) throw new Error('Theatre not found.');
    return theatre;
  },

  cities: async () => {
    const theatres = await Theatre.findAll({
      where: { isActive: true },
      attributes: ['city'],
      group: ['city'],
      order: [['city', 'ASC']],
    });
    return theatres.map((t) => t.city);
  },

  screens: async ({ theatreId }, context) => {
    let targetTheatreId = theatreId;
    if (context && context.user && context.user.role === 'ADMIN') {
      if (theatreId) {
        await checkTheatreAdmin(context, theatreId);
      }
      targetTheatreId = await getAdminTheatreId(context);
    }
    if (!targetTheatreId && theatreId) {
      targetTheatreId = theatreId;
    }
    if (!targetTheatreId || targetTheatreId === 'undefined') {
      return [];
    }
    const screens = await Screen.findAll({
      where: { theatreId: targetTheatreId },
      include: [{ model: Seat, as: 'seats' }],
      order: [['screenNumber', 'ASC']],
    });
    return screens;
  },

  screen: async ({ id }) => {
    const screen = await Screen.findByPk(id, {
      include: [
        { model: Theatre, as: 'theatre' },
        { model: Seat, as: 'seats' },
      ],
    });
    if (!screen) throw new Error('Screen not found.');
    return screen;
  },

  seatsByScreen: async ({ screenId }) => {
    const seats = await Seat.findAll({
      where: { screenId, isActive: true },
      order: [['row', 'ASC'], ['id', 'ASC']],
    });
    return seats;
  },

  movies: async ({ includeInactive }, context) => {
    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    const movies = await Movie.findAll({
      where,
      include: [{ model: Show, as: 'shows', where: { isActive: true }, required: false }],
      order: [['createdAt', 'DESC']],
    });
    return movies;
  },

  movie: async ({ id }) => {
    const movie = await Movie.findByPk(id, {
      include: [
        {
          model: Show,
          as: 'shows',
          where: { isActive: true },
          required: false,
          include: [{ model: Theatre, as: 'theatre' }],
        },
      ],
    });
    if (!movie) throw new Error('Movie not found.');
    return movie;
  },

  moviesByTheatre: async ({ theatreId }) => {
    const shows = await Show.findAll({
      where: { theatreId, isActive: true },
      attributes: ['movieId'],
      group: ['movieId'],
    });
    const movieIds = shows.map((s) => s.movieId);

    const movies = await Movie.findAll({
      where: {
        id: { [Op.in]: movieIds },
        isActive: true,
      },
      order: [['title', 'ASC']],
    });
    return movies;
  },

  theatresByMovie: async ({ movieId }) => {
    const shows = await Show.findAll({
      where: { movieId, isActive: true },
      attributes: ['theatreId'],
      group: ['theatreId'],
    });
    const theatreIds = shows.map((s) => s.theatreId);

    const theatres = await Theatre.findAll({
      where: {
        id: { [Op.in]: theatreIds },
        isActive: true,
      },
      order: [['name', 'ASC']],
    });
    return theatres;
  },

  shows: async ({ movieId, theatreId, showDate }) => {
    const where = { isActive: true };
    if (movieId) where.movieId = movieId;
    if (theatreId) where.theatreId = theatreId;
    if (showDate) where.showDate = showDate;

    const shows = await Show.findAll({
      where,
      include: [
        { model: Movie, as: 'movie' },
        { model: Theatre, as: 'theatre' },
        { model: Screen, as: 'screenRef' },
      ],
      order: [['showDate', 'ASC'], ['showTime', 'ASC']],
    });
    return shows;
  },

  showsByTheatre: async ({ theatreId, showDate }, context) => {
    let targetTheatreId = theatreId;
    if (context && context.user && context.user.role === 'ADMIN') {
      if (theatreId) {
        await checkTheatreAdmin(context, theatreId);
      }
      targetTheatreId = await getAdminTheatreId(context);
    }
    if (!targetTheatreId && theatreId) {
      targetTheatreId = theatreId;
    }
    if (!targetTheatreId || targetTheatreId === 'undefined') {
      return [];
    }
    const where = { theatreId: targetTheatreId, isActive: true };
    if (showDate) where.showDate = showDate;

    const shows = await Show.findAll({
      where,
      include: [
        { model: Movie, as: 'movie' },
        { model: Theatre, as: 'theatre' },
        { model: Screen, as: 'screenRef' },
      ],
      order: [['showDate', 'ASC'], ['showTime', 'ASC']],
    });
    return shows;
  },

  showsByMovie: async ({ movieId, city, showDate }) => {
    const where = { movieId, isActive: true };
    if (showDate) where.showDate = showDate;

    const theatreWhere = { isActive: true };
    if (city) theatreWhere.city = city;

    const shows = await Show.findAll({
      where,
      include: [
        { model: Movie, as: 'movie' },
        { model: Theatre, as: 'theatre', where: theatreWhere },
        { model: Screen, as: 'screenRef' },
      ],
      order: [['showDate', 'ASC'], ['showTime', 'ASC']],
    });
    return shows;
  },

  show: async ({ id }) => {
    const show = await Show.findByPk(id, {
      include: [
        { model: Movie, as: 'movie' },
        { model: Theatre, as: 'theatre' },
        { model: Screen, as: 'screenRef' },
      ],
    });
    if (!show) throw new Error('Show not found.');
    return show;
  },

  seats: async ({ showId }) => {
    const formattedSeats = await getShowSeatsFormatted(showId);
    return formattedSeats;
  },

  availableSeats: async ({ showId }) => {
    const count = await ShowSeat.count({
      where: { showId, status: 'AVAILABLE' },
    });
    return count;
  },

  myBookings: async (args, context) => {
    const authUser = checkAuth(context);
    const bookings = await Booking.findAll({
      where: { userId: authUser.id },
      include: [
        {
          model: Show,
          as: 'show',
          include: [
            { model: Movie, as: 'movie' },
            { model: Theatre, as: 'theatre' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return bookings.map((b) => ({
      ...b.toJSON(),
      seats: typeof b.seats === 'string' ? JSON.parse(b.seats) : b.seats,
    }));
  },

  bookingBySession: async ({ sessionId }, context) => {
    checkAuth(context);
    const booking = await Booking.findOne({
      where: { stripeSessionId: sessionId },
      include: [
        {
          model: Show,
          as: 'show',
          include: [
            { model: Movie, as: 'movie' },
            { model: Theatre, as: 'theatre' },
          ],
        },
        { model: User, as: 'user' },
      ],
    });

    if (!booking) throw new Error('Booking session not found.');
    return {
      ...booking.toJSON(),
      seats: typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats,
    };
  },

  verifyPaymentSession: async ({ sessionId }, context) => {
    checkAuth(context);
    const booking = await verifyAndRetrievePaymentSession(sessionId);
    return booking;
  },

  booking: async ({ id }, context) => {
    const authUser = checkAuth(context);
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Show,
          as: 'show',
          include: [
            { model: Movie, as: 'movie' },
            { model: Theatre, as: 'theatre' },
          ],
        },
        { model: User, as: 'user' },
      ],
    });

    if (!booking) throw new Error('Booking not found.');
    if (authUser.role === 'USER' && booking.userId !== authUser.id) {
      throw new Error('Access denied to this booking.');
    }
    if (authUser.role === 'ADMIN') {
      const adminTheatreId = await getAdminTheatreId(context);
      if (Number(booking.show.theatreId) !== Number(adminTheatreId)) {
        throw new Error('Access denied. Booking belongs to another theatre.');
      }
    }

    return {
      ...booking.toJSON(),
      seats: typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats,
    };
  },

  allBookings: async ({ theatreId }, context) => {
    const authUser = checkAdmin(context);
    const showWhere = {};

    if (authUser.role === 'ADMIN') {
      const adminTheatreId = await getAdminTheatreId(context);
      if (!adminTheatreId) {
        throw new Error('Admin has no assigned theatre.');
      }
      showWhere.theatreId = adminTheatreId;
    } else if (theatreId && theatreId !== 'undefined') {
      showWhere.theatreId = theatreId;
    }

    const bookings = await Booking.findAll({
      include: [
        {
          model: Show,
          as: 'show',
          where: showWhere,
          include: [
            { model: Movie, as: 'movie' },
            { model: Theatre, as: 'theatre' },
          ],
        },
        { model: User, as: 'user' },
      ],
      order: [['createdAt', 'DESC']],
    });

    return bookings.map((b) => ({
      ...b.toJSON(),
      seats: typeof b.seats === 'string' ? JSON.parse(b.seats) : b.seats,
    }));
  },

  dashboardStats: async ({ theatreId }, context) => {
    const authUser = checkAdmin(context);
    let targetTheatreId = theatreId;

    if (authUser.role === 'ADMIN') {
      targetTheatreId = await getAdminTheatreId(context);
    }

    const showWhere = (targetTheatreId && targetTheatreId !== 'undefined') ? { theatreId: targetTheatreId } : {};

    const totalUsers = await User.count({ where: { role: 'USER' } });
    const totalMovies = await Movie.count();
    const activeShows = await Show.count({ where: { ...showWhere, isActive: true } });

    const bookingsRaw = await Booking.findAll({
      include: [
        {
          model: Show,
          as: 'show',
          where: showWhere,
        },
      ],
    });

    const totalBookings = bookingsRaw.length;
    const confirmedBookings = bookingsRaw.filter((b) => b.status === 'CONFIRMED');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const recentBookingsRaw = await Booking.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Show,
          as: 'show',
          where: showWhere,
          include: [
            { model: Movie, as: 'movie' },
            { model: Theatre, as: 'theatre' },
          ],
        },
        { model: User, as: 'user' },
      ],
    });

    const recentBookings = recentBookingsRaw.map((b) => ({
      ...b.toJSON(),
      seats: typeof b.seats === 'string' ? JSON.parse(b.seats) : b.seats,
    }));

    return {
      totalUsers,
      totalMovies,
      activeShows,
      totalBookings,
      totalRevenue,
      recentBookings,
    };
  },

  platformStats: async (args, context) => {
    checkSuperAdmin(context);

    const totalTheatres = await Theatre.count();
    const totalScreens = await Screen.count();
    const totalAdmins = await User.count({ where: { role: 'ADMIN' } });
    const totalUsers = await User.count({ where: { role: 'USER' } });
    const totalMovies = await Movie.count();
    const totalShows = await Show.count();
    const totalBookings = await Booking.count();

    const confirmedBookings = await Booking.findAll({ where: { status: 'CONFIRMED' } });
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      totalTheatres,
      totalScreens,
      totalAdmins,
      totalUsers,
      totalMovies,
      totalShows,
      totalBookings,
      totalRevenue,
    };
  },

  // Mutations (PROTECTED: register, login remain exact)
  register: async ({ input }) => {
    const { name, email, password, phone, age } = input;

    if (!name || !email || !password || !phone || age === undefined) {
      throw new Error('All registration fields are required.');
    }

    if (age < 5 || age > 120) {
      throw new Error('Please enter a valid age between 5 and 120.');
    }

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new Error('A user with this email address already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      age: parseInt(age, 10),
      role: 'USER',
      isActive: true,
    });

    const token = generateToken(user);
    return { token, user };
  },

  login: async ({ input }) => {
    const { email, password } = input;

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{ model: Theatre, as: 'theatre' }],
    });
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = generateToken(user);
    return { token, user };
  },

  // Theatre Management (Super Admin)
  createTheatre: async ({ input }, context) => {
    checkSuperAdmin(context);
    const theatre = await Theatre.create(input);
    return theatre;
  },

  updateTheatre: async ({ id, input }, context) => {
    checkSuperAdmin(context);
    const theatre = await Theatre.findByPk(id);
    if (!theatre) throw new Error('Theatre not found.');
    await theatre.update(input);
    return theatre;
  },

  deactivateTheatre: async ({ id }, context) => {
    checkSuperAdmin(context);
    const theatre = await Theatre.findByPk(id);
    if (!theatre) throw new Error('Theatre not found.');
    theatre.isActive = !theatre.isActive;
    await theatre.save();
    return theatre;
  },

  // Admin Management (Super Admin)
  createAdmin: async ({ name, email, password, phone, age, theatreId }, context) => {
    checkSuperAdmin(context);

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    const theatre = await Theatre.findByPk(theatreId);
    if (!theatre) throw new Error('Target Theatre not found.');

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      age: parseInt(age, 10),
      role: 'ADMIN',
      theatreId: parseInt(theatreId, 10),
      isActive: true,
    });

    return await User.findByPk(adminUser.id, {
      include: [{ model: Theatre, as: 'theatre' }],
    });
  },

  assignAdminToTheatre: async ({ userId, theatreId }, context) => {
    checkSuperAdmin(context);
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found.');

    const theatre = await Theatre.findByPk(theatreId);
    if (!theatre) throw new Error('Theatre not found.');

    user.role = 'ADMIN';
    user.theatreId = parseInt(theatreId, 10);
    await user.save();

    return await User.findByPk(user.id, {
      include: [{ model: Theatre, as: 'theatre' }],
    });
  },

  updateAdmin: async ({ id, name, phone, theatreId }, context) => {
    checkSuperAdmin(context);
    const user = await User.findByPk(id);
    if (!user) throw new Error('Admin user not found.');

    if (theatreId) {
      const theatre = await Theatre.findByPk(theatreId);
      if (!theatre) throw new Error('Theatre not found.');
      user.theatreId = parseInt(theatreId, 10);
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    await user.save();

    return await User.findByPk(user.id, {
      include: [{ model: Theatre, as: 'theatre' }],
    });
  },

  // Screen Management (Admin/SuperAdmin)
  createScreen: async ({ input }, context) => {
    const authUser = checkAdmin(context);
    if (input.theatreId) {
      await checkTheatreAdmin(context, input.theatreId);
    }
    let targetTheatreId = input.theatreId;
    if (authUser.role === 'ADMIN') {
      targetTheatreId = await getAdminTheatreId(context);
    }
    if (!targetTheatreId || targetTheatreId === 'undefined') {
      throw new Error('Valid Theatre ID is required to create a screen.');
    }

    const screen = await Screen.create({
      theatreId: parseInt(targetTheatreId, 10),
      name: input.name,
      screenNumber: parseInt(input.screenNumber, 10),
      screenType: input.screenType || 'STANDARD',
      totalSeats: 0,
      isActive: true,
    });

    return screen;
  },

  updateScreen: async ({ id, input }, context) => {
    const screen = await Screen.findByPk(id);
    if (!screen) throw new Error('Screen not found.');
    await checkTheatreAdmin(context, screen.theatreId);

    await screen.update({
      name: input.name || screen.name,
      screenNumber: input.screenNumber ? parseInt(input.screenNumber, 10) : screen.screenNumber,
      screenType: input.screenType || screen.screenType,
    });

    return screen;
  },

  deleteScreen: async ({ id }, context) => {
    const screen = await Screen.findByPk(id);
    if (!screen) throw new Error('Screen not found.');
    await checkTheatreAdmin(context, screen.theatreId);

    // Check for existing active shows or bookings
    const activeShows = await Show.count({ where: { screenId: id, isActive: true } });
    if (activeShows > 0) {
      throw new Error('Cannot delete screen: Active shows are scheduled on this screen.');
    }

    await screen.destroy();
    return true;
  },

  // Dynamic Custom Seat Layout Generation (Admin UI)
  generateSeatLayout: async ({ input }, context) => {
    const { screenId, rows } = input;

    const screen = await Screen.findByPk(screenId);
    if (!screen) throw new Error('Screen not found.');

    await checkTheatreAdmin(context, screen.theatreId);

    // Layout modification safety check: Verify if future shows or active bookings exist
    const futureShows = await Show.findAll({ where: { screenId, isActive: true } });
    if (futureShows.length > 0) {
      const showIds = futureShows.map((s) => s.id);
      const activeBookings = await Booking.count({
        where: {
          showId: { [Op.in]: showIds },
          status: 'CONFIRMED',
        },
      });

      if (activeBookings > 0) {
        throw new Error('Cannot modify seat layout: This screen has existing active bookings!');
      }
    }

    const transaction = await sequelize.transaction();
    try {
      // Delete existing seats for this screen
      await Seat.destroy({ where: { screenId }, transaction });

      const seatsToCreate = [];
      let totalCreatedSeats = 0;

      for (const rowConfig of rows) {
        const { row, seatCount, seatType = 'REGULAR', price = 200 } = rowConfig;
        for (let num = 1; num <= seatCount; num++) {
          seatsToCreate.push({
            screenId,
            seatNumber: `${row}${num}`,
            row,
            seatType,
            price: parseFloat(price),
            isActive: true,
          });
          totalCreatedSeats++;
        }
      }

      const createdSeats = await Seat.bulkCreate(seatsToCreate, { transaction });

      // Update Screen totalSeats count
      screen.totalSeats = totalCreatedSeats;
      await screen.save({ transaction });

      await transaction.commit();
      return createdSeats;
    } catch (err) {
      await transaction.rollback();
      throw new Error(`Failed to generate seat layout: ${err.message}`);
    }
  },

  // Movie Management (Admin / Super Admin)
  createMovie: async ({ input }, context) => {
    checkAdmin(context);
    const movie = await Movie.create(input);
    return movie;
  },

  updateMovie: async ({ id, input }, context) => {
    checkAdmin(context);
    const movie = await Movie.findByPk(id);
    if (!movie) throw new Error('Movie not found.');
    await movie.update(input);
    return movie;
  },

  deleteMovie: async ({ id }, context) => {
    checkAdmin(context);
    const movie = await Movie.findByPk(id);
    if (!movie) throw new Error('Movie not found.');
    await movie.destroy();
    return true;
  },

  toggleMovieStatus: async ({ id }, context) => {
    checkAdmin(context);
    const movie = await Movie.findByPk(id);
    if (!movie) throw new Error('Movie not found.');
    movie.isActive = !movie.isActive;
    await movie.save();
    return movie;
  },

  // Show Creation with Automatic ShowSeat Generation
  createShow: async ({ input }, context) => {
    const authUser = checkAdmin(context);
    if (input.theatreId) {
      await checkTheatreAdmin(context, input.theatreId);
    }
    let targetTheatreId = input.theatreId;
    if (authUser.role === 'ADMIN') {
      targetTheatreId = await getAdminTheatreId(context);
    }
    if (!targetTheatreId || targetTheatreId === 'undefined') {
      throw new Error('Valid Theatre ID is required to create a show.');
    }

    const { movieId, screenId, showDate, showTime, language = 'English', format = '2D', price = 200 } = input;

    const movie = await Movie.findByPk(movieId);
    if (!movie || !movie.isActive) throw new Error('Movie not found or inactive.');

    const theatre = await Theatre.findByPk(targetTheatreId);
    if (!theatre || !theatre.isActive) throw new Error('Theatre not found or inactive.');

    const screen = await Screen.findByPk(screenId);
    if (!screen || !screen.isActive) throw new Error('Screen not found or inactive.');

    if (Number(screen.theatreId) !== Number(targetTheatreId)) {
      throw new Error('Screen does not belong to the selected theatre.');
    }

    // Check for overlapping shows on the same screen at the same date and time
    const overlappingShow = await Show.findOne({
      where: {
        screenId,
        showDate,
        showTime,
        isActive: true,
      },
    });

    if (overlappingShow) {
      throw new Error(`Screen "${screen.name}" already has a show scheduled at ${showTime} on ${showDate}.`);
    }

    // Fetch physical seats for this screen
    const physicalSeats = await Seat.findAll({ where: { screenId, isActive: true } });
    if (physicalSeats.length === 0) {
      throw new Error(`Screen "${screen.name}" has no seating configured. Please generate seat layout first.`);
    }

    const transaction = await sequelize.transaction();
    try {
      const show = await Show.create(
        {
          movieId: parseInt(movieId, 10),
          theatreId: parseInt(targetTheatreId, 10),
          screenId: parseInt(screenId, 10),
          showDate,
          showTime,
          screen: screen.name,
          language,
          format,
          totalSeats: physicalSeats.length,
          availableSeats: physicalSeats.length,
          price: parseFloat(price),
          isActive: true,
        },
        { transaction }
      );

      // Create ShowSeat records for each physical seat
      const showSeatsToCreate = physicalSeats.map((seat) => ({
        showId: show.id,
        seatId: seat.id,
        status: 'AVAILABLE',
      }));

      await ShowSeat.bulkCreate(showSeatsToCreate, { transaction });
      await transaction.commit();

      return await Show.findByPk(show.id, {
        include: [
          { model: Movie, as: 'movie' },
          { model: Theatre, as: 'theatre' },
          { model: Screen, as: 'screenRef' },
        ],
      });
    } catch (err) {
      await transaction.rollback();
      throw new Error(`Failed to create show: ${err.message}`);
    }
  },

  updateShow: async ({ id, input }, context) => {
    const show = await Show.findByPk(id);
    if (!show) throw new Error('Show not found.');
    checkTheatreAdmin(context, show.theatreId);
    await show.update(input);
    return show;
  },

  deleteShow: async ({ id }, context) => {
    const show = await Show.findByPk(id);
    if (!show) throw new Error('Show not found.');
    checkTheatreAdmin(context, show.theatreId);
    await show.destroy();
    return true;
  },

  // Real-Time Locking & Booking
  lockSeats: async ({ showId, seats }, context) => {
    const authUser = checkAuth(context);
    const result = await lockSeatsUtil(showId, seats, authUser.id);
    if (!result.success) {
      throw new Error(result.message);
    }
    return {
      success: result.success,
      message: result.message,
      expiresAt: result.expiresAt ? result.expiresAt.toISOString() : null,
    };
  },

  releaseSeats: async ({ showId, seats }, context) => {
    const authUser = checkAuth(context);
    const result = await releaseSeatsUtil(showId, seats, authUser.id);
    return {
      success: result.success,
      message: result.message,
    };
  },

  createCheckoutSession: async ({ input }, context) => {
    const authUser = checkAuth(context);
    const result = await createBookingCheckoutSession({
      showId: input.showId,
      seats: input.seats,
      idProofType: input.idProofType,
      idProofNumber: input.idProofNumber,
      userId: authUser.id,
    });
    return result;
  },

  createBooking: async ({ input }, context) => {
    const authUser = checkAuth(context);
    const result = await createBookingCheckoutSession({
      showId: input.showId,
      seats: input.seats,
      idProofType: input.idProofType,
      idProofNumber: input.idProofNumber,
      userId: authUser.id,
    });

    const booking = await Booking.findByPk(result.bookingId, {
      include: [
        {
          model: Show,
          as: 'show',
          include: [
            { model: Movie, as: 'movie' },
            { model: Theatre, as: 'theatre' },
          ],
        },
        { model: User, as: 'user' },
      ],
    });

    return {
      ...booking.toJSON(),
      seats: typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats,
    };
  },

  cancelBooking: async ({ id }, context) => {
    const authUser = checkAuth(context);
    const booking = await Booking.findByPk(id, {
      include: [{ model: Show, as: 'show' }],
    });

    if (!booking) throw new Error('Booking not found.');

    if (authUser.role === 'USER' && booking.userId !== authUser.id) {
      throw new Error('Access denied to cancel this booking.');
    }
    if (authUser.role === 'ADMIN' && Number(booking.show.theatreId) !== Number(authUser.theatreId)) {
      throw new Error('Access denied. Booking belongs to another theatre.');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('This booking is already cancelled.');
    }

    // Initiate Stripe Refund if payment intent exists and status is COMPLETED
    if (booking.stripePaymentIntentId && booking.paymentStatus === 'COMPLETED') {
      try {
        await stripeService.createRefund(booking.stripePaymentIntentId);
        console.log(`[Stripe] Refund created successfully for Booking ID: ${id}`);
      } catch (err) {
        console.error(`[Stripe] Refund error for Booking ID ${id}:`, err.message);
        throw new Error(`Cancellation failed during Stripe refund: ${err.message}`);
      }
    }

    const transaction = await sequelize.transaction();
    try {
      const seatNumbers = typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats;

      const physicalSeats = await Seat.findAll({
        where: {
          screenId: booking.show.screenId,
          seatNumber: { [Op.in]: seatNumbers },
        },
        transaction,
      });

      const seatIds = physicalSeats.map((s) => s.id);

      // Reset ShowSeats to AVAILABLE
      await ShowSeat.update(
        { status: 'AVAILABLE', lockedBy: null, lockedAt: null },
        {
          where: {
            showId: booking.showId,
            seatId: { [Op.in]: seatIds },
          },
          transaction,
        }
      );

      // Increment show available seats
      const show = await Show.findByPk(booking.showId, { transaction });
      if (show) {
        show.availableSeats = show.availableSeats + seatNumbers.length;
        await show.save({ transaction });
      }

      booking.status = 'CANCELLED';
      booking.paymentStatus = 'REFUNDED';
      await booking.save({ transaction });

      if (booking.stripeSessionId) {
        const payment = await Payment.findOne({
          where: { stripeSessionId: booking.stripeSessionId },
          transaction,
        });
        if (payment) {
          payment.status = 'REFUNDED';
          await payment.save({ transaction });
        }
      }

      await transaction.commit();

      if (global.io) {
        const updatedSeats = await getShowSeatsFormatted(booking.showId);
        global.io.to(`show_${booking.showId}`).emit('seatStatusChanged', {
          showId: booking.showId,
          seats: updatedSeats,
          message: 'Booking cancelled and seats made available.',
        });
      }

      return {
        ...booking.toJSON(),
        seats: seatNumbers,
      };
    } catch (err) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw new Error(`Cancellation failed: ${err.message}`);
    }
  },

  updateUserStatus: async ({ id, isActive }, context) => {
    checkAdmin(context);
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found.');
    user.isActive = isActive;
    await user.save();
    return user;
  },

  deleteUser: async ({ id }, context) => {
    checkAdmin(context);
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found.');
    await user.destroy();
    return true;
  },
};

module.exports = resolvers;
