const { Op, Transaction } = require('sequelize');
const {
  Booking,
  Show,
  Movie,
  Theatre,
  Seat,
  ShowSeat,
  User,
  Payment,
  sequelize,
} = require('../models');
const stripeService = require('./stripeService');
const { validateIdProof, checkAgeRestriction } = require('../utils/validators');
const { getShowSeatsFormatted } = require('../utils/seatLock');

/**
 * Creates a PENDING booking, locks seats, and initializes a Stripe Checkout session.
 */
const createBookingCheckoutSession = async ({
  showId,
  seats: requestedSeats,
  idProofType,
  idProofNumber,
  userId,
}) => {
  if (!requestedSeats || requestedSeats.length === 0) {
    throw new Error('Please select at least one seat to book.');
  }

  const idCheck = validateIdProof(idProofType, idProofNumber);
  if (!idCheck.valid) {
    throw new Error(idCheck.message);
  }

  const dbUser = await User.findByPk(userId);
  if (!dbUser) {
    throw new Error('User not found.');
  }

  const show = await Show.findByPk(showId, {
    include: [
      { model: Movie, as: 'movie' },
      { model: Theatre, as: 'theatre' },
    ],
  });

  if (!show || !show.isActive) {
    throw new Error('Selected show is unavailable.');
  }

  const ageCheck = checkAgeRestriction(dbUser.age, show.movie.minimumAge);
  if (!ageCheck.allowed) {
    throw new Error(ageCheck.message);
  }

  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  let booking;
  let totalAmount = 0;

  try {
    const physicalSeats = await Seat.findAll({
      where: {
        screenId: show.screenId,
        seatNumber: { [Op.in]: requestedSeats },
      },
      transaction,
    });

    if (physicalSeats.length !== requestedSeats.length) {
      await transaction.rollback();
      throw new Error('One or more selected seats do not exist for this show.');
    }

    const seatIds = physicalSeats.map((s) => s.id);

    const showSeatsToBook = await ShowSeat.findAll({
      where: {
        showId,
        seatId: { [Op.in]: seatIds },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const LOCK_DURATION_MS = 5 * 60 * 1000;
    const now = new Date();
    const expiredTime = new Date(now.getTime() - LOCK_DURATION_MS);

    for (const ss of showSeatsToBook) {
      const pSeat = physicalSeats.find((p) => p.id === ss.seatId);
      const sNum = pSeat ? pSeat.seatNumber : ss.seatId;

      if (ss.status === 'BOOKED') {
        await transaction.rollback();
        throw new Error(`Seat ${sNum} has already been booked by another customer.`);
      }
      if (ss.status === 'LOCKED' && Number(ss.lockedBy) !== Number(userId)) {
        if (ss.lockedAt && ss.lockedAt > expiredTime) {
          await transaction.rollback();
          throw new Error(`Seat ${sNum} is reserved by another user. Please select another seat.`);
        }
      }
    }

    // Retain LOCKED status for the user during payment
    for (const ss of showSeatsToBook) {
      ss.status = 'LOCKED';
      ss.lockedBy = userId;
      ss.lockedAt = now;
      await ss.save({ transaction });
    }

    totalAmount = physicalSeats.reduce((sum, s) => sum + s.price, 0);
    const bookingRef = `CB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    booking = await Booking.create(
      {
        userId,
        showId,
        seats: JSON.stringify(requestedSeats),
        totalAmount,
        bookingReference: bookingRef,
        idProofType: idProofType.toUpperCase(),
        idProofNumber: idProofNumber.trim().toUpperCase(),
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
      { transaction }
    );

    await transaction.commit();
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw err;
  }

  // Create Stripe Checkout Session outside DB transaction
  try {
    const session = await stripeService.createCheckoutSession({
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      movieTitle: show.movie.title,
      theatreName: show.theatre ? show.theatre.name : 'Cinema',
      screenName: show.screen,
      seats: requestedSeats,
      totalAmount,
      userEmail: dbUser.email,
      showId: show.id,
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    await Payment.create({
      bookingId: booking.id,
      stripeSessionId: session.id,
      amount: totalAmount,
      currency: 'INR',
      status: 'PENDING',
    });

    console.log(`[Stripe] Checkout session created for Booking ID ${booking.id}: ${session.id}`);

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      bookingId: booking.id,
    };
  } catch (err) {
    // If Stripe Checkout Session creation fails, release locked seats and mark booking FAILED
    await failBookingAndReleaseSeats(booking.id);
    throw err;
  }
};

/**
 * Confirms payment and updates booking to CONFIRMED atomically (IDEMPOTENT).
 */
const confirmBookingAndPayment = async (bookingId, paymentIntentId) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });

  try {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) {
      await transaction.rollback();
      return false;
    }

    // IDEMPOTENCY CHECK: If already confirmed & completed, do nothing
    if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'COMPLETED') {
      await transaction.rollback();
      console.log(`[Stripe] Booking ${bookingId} is already CONFIRMED and COMPLETED. Skipping.`);
      return true;
    }

    const show = await Show.findByPk(booking.showId, { transaction });
    const seatNumbers = typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats;

    if (show) {
      const physicalSeats = await Seat.findAll({
        where: {
          screenId: show.screenId,
          seatNumber: { [Op.in]: seatNumbers },
        },
        transaction,
      });

      const seatIds = physicalSeats.map((s) => s.id);

      const showSeatsToBook = await ShowSeat.findAll({
        where: {
          showId: booking.showId,
          seatId: { [Op.in]: seatIds },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      for (const ss of showSeatsToBook) {
        ss.status = 'BOOKED';
        ss.lockedBy = null;
        ss.lockedAt = null;
        await ss.save({ transaction });
      }

      // Decrement available seats exactly once
      show.availableSeats = Math.max(0, show.availableSeats - seatNumbers.length);
      await show.save({ transaction });
    }

    booking.status = 'CONFIRMED';
    booking.paymentStatus = 'COMPLETED';
    if (paymentIntentId) {
      booking.stripePaymentIntentId = paymentIntentId;
    }
    await booking.save({ transaction });

    if (booking.stripeSessionId) {
      const payment = await Payment.findOne({
        where: { stripeSessionId: booking.stripeSessionId },
        transaction,
      });
      if (payment) {
        payment.status = 'COMPLETED';
        if (paymentIntentId) payment.stripePaymentIntentId = paymentIntentId;
        await payment.save({ transaction });
      }
    }

    await transaction.commit();

    console.log(`[Stripe] Payment completed & Booking confirmed for Booking ID: ${bookingId}`);

    // Socket.io Real-Time Seat Status Broadcast
    if (global.io) {
      const updatedSeats = await getShowSeatsFormatted(booking.showId);
      global.io.to(`show_${booking.showId}`).emit('seatStatusChanged', {
        showId: booking.showId,
        seats: updatedSeats,
        bookedSeats: seatNumbers,
      });
    }

    return true;
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error(`[Stripe] Error confirming booking ${bookingId}:`, err.message);
    throw err;
  }
};

/**
 * Marks booking FAILED/CANCELLED and releases seats to AVAILABLE.
 */
const failBookingAndReleaseSeats = async (bookingId) => {
  const transaction = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) {
      await transaction.rollback();
      return false;
    }

    if (booking.status === 'CONFIRMED') {
      await transaction.rollback();
      console.log(`[Stripe] Cannot fail booking ${bookingId}: already CONFIRMED.`);
      return false;
    }

    const show = await Show.findByPk(booking.showId, { transaction });
    const seatNumbers = typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats;

    if (show) {
      const physicalSeats = await Seat.findAll({
        where: {
          screenId: show.screenId,
          seatNumber: { [Op.in]: seatNumbers },
        },
        transaction,
      });
      const seatIds = physicalSeats.map((s) => s.id);

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
    }

    booking.status = 'CANCELLED';
    booking.paymentStatus = 'FAILED';
    await booking.save({ transaction });

    if (booking.stripeSessionId) {
      const payment = await Payment.findOne({
        where: { stripeSessionId: booking.stripeSessionId },
        transaction,
      });
      if (payment) {
        payment.status = 'FAILED';
        await payment.save({ transaction });
      }
    }

    await transaction.commit();

    console.log(`[Stripe] Payment failed / cancelled. Seats released for Booking ID: ${bookingId}`);

    if (global.io) {
      const updatedSeats = await getShowSeatsFormatted(booking.showId);
      global.io.to(`show_${booking.showId}`).emit('seatStatusChanged', {
        showId: booking.showId,
        seats: updatedSeats,
        releasedSeats: seatNumbers,
      });
    }

    return true;
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error(`[Stripe] Error failing booking ${bookingId}:`, err.message);
    throw err;
  }
};

/**
 * Server-side payment verification by Stripe Checkout Session ID.
 */
const verifyAndRetrievePaymentSession = async (sessionId) => {
  let booking = await Booking.findOne({
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

  if (!booking) {
    throw new Error('Booking session not found.');
  }

  // If status is still PENDING, double-check server-side with Stripe API
  if (booking.paymentStatus === 'PENDING') {
    try {
      const session = await stripeService.retrieveCheckoutSession(sessionId);
      if (session && session.payment_status === 'paid') {
        console.log(`[Stripe] Payment verified server-side for session ${sessionId}. Confirming booking...`);
        await confirmBookingAndPayment(booking.id, session.payment_intent);
        booking = await Booking.findByPk(booking.id, {
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
      } else if (session && session.status === 'expired') {
        await failBookingAndReleaseSeats(booking.id);
        booking = await Booking.findByPk(booking.id, {
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
      }
    } catch (err) {
      console.error(`[Stripe] Verification check error for session ${sessionId}:`, err.message);
    }
  }

  return {
    ...booking.toJSON(),
    seats: typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats,
  };
};

module.exports = {
  createBookingCheckoutSession,
  confirmBookingAndPayment,
  failBookingAndReleaseSeats,
  verifyAndRetrievePaymentSession,
};
