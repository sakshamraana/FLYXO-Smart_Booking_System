const { Seat, Show, ShowSeat, sequelize } = require('../models');
const { Transaction, Op } = require('sequelize');

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let ioInstance = null;

const initSeatLocking = (io) => {
  ioInstance = io;

  // Run periodic background cleanup every 15 seconds to release expired seat locks
  setInterval(async () => {
    try {
      await releaseExpiredLocks();
    } catch (err) {
      console.error('Error during background seat lock cleanup:', err.message);
    }
  }, 15000);
};

const getShowSeatsFormatted = async (showId) => {
  const showSeats = await ShowSeat.findAll({
    where: { showId },
    include: [{ model: Seat, as: 'seat' }],
    order: [
      [{ model: Seat, as: 'seat' }, 'row', 'ASC'],
      [{ model: Seat, as: 'seat' }, 'id', 'ASC'],
    ],
  });

  return showSeats.map((ss) => ({
    id: ss.id,
    showId: ss.showId,
    seatId: ss.seatId,
    seatNumber: ss.seat ? ss.seat.seatNumber : null,
    row: ss.seat ? ss.seat.row : null,
    seatType: ss.seat ? ss.seat.seatType : 'REGULAR',
    price: ss.seat ? ss.seat.price : 200,
    status: ss.status,
    lockedBy: ss.lockedBy,
    lockedAt: ss.lockedAt ? ss.lockedAt.toISOString() : null,
  }));
};

const releaseExpiredLocks = async () => {
  const expiredTime = new Date(Date.now() - LOCK_DURATION_MS);

  const expiredShowSeats = await ShowSeat.findAll({
    where: {
      status: 'LOCKED',
      lockedAt: {
        [Op.lt]: expiredTime,
      },
    },
  });

  if (expiredShowSeats.length > 0) {
    const showIds = [...new Set(expiredShowSeats.map((s) => s.showId))];

    for (const ss of expiredShowSeats) {
      ss.status = 'AVAILABLE';
      ss.lockedBy = null;
      ss.lockedAt = null;
      await ss.save();
    }

    if (ioInstance) {
      for (const showId of showIds) {
        const updatedSeats = await getShowSeatsFormatted(showId);
        ioInstance.to(`show_${showId}`).emit('seatStatusChanged', {
          showId,
          seats: updatedSeats,
          message: 'Expired seat locks released.',
        });
      }
    }
  }
};

const lockSeats = async (showId, seatNumbers, userId) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });
  try {
    const show = await Show.findByPk(showId, { transaction });
    if (!show || !show.isActive) {
      await transaction.rollback();
      return { success: false, message: 'Show not found or inactive.' };
    }

    // Find physical Seats matching seatNumbers for this show's screen
    const physicalSeats = await Seat.findAll({
      where: {
        screenId: show.screenId,
        seatNumber: { [Op.in]: seatNumbers },
      },
      transaction,
    });

    if (physicalSeats.length !== seatNumbers.length) {
      await transaction.rollback();
      return { success: false, message: 'One or more selected seats do not exist on this screen.' };
    }

    const seatIds = physicalSeats.map((s) => s.id);

    // Find ShowSeat records with row lock (FOR UPDATE)
    const showSeats = await ShowSeat.findAll({
      where: {
        showId,
        seatId: { [Op.in]: seatIds },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (showSeats.length !== seatNumbers.length) {
      await transaction.rollback();
      return { success: false, message: 'Show seat records not initialized for this show.' };
    }

    const now = new Date();
    const expiredTime = new Date(now.getTime() - LOCK_DURATION_MS);

    for (const ss of showSeats) {
      const pSeat = physicalSeats.find((p) => p.id === ss.seatId);
      const sNum = pSeat ? pSeat.seatNumber : ss.seatId;

      if (ss.status === 'BOOKED') {
        await transaction.rollback();
        return { success: false, message: `Seat ${sNum} is already booked.` };
      }
      if (ss.status === 'LOCKED' && Number(ss.lockedBy) !== Number(userId)) {
        if (ss.lockedAt && ss.lockedAt > expiredTime) {
          await transaction.rollback();
          return { success: false, message: `Seat ${sNum} is reserved by another user.` };
        }
      }
    }

    for (const ss of showSeats) {
      ss.status = 'LOCKED';
      ss.lockedBy = userId;
      ss.lockedAt = now;
      await ss.save({ transaction });
    }

    await transaction.commit();

    if (ioInstance) {
      const allSeats = await getShowSeatsFormatted(showId);
      ioInstance.to(`show_${showId}`).emit('seatStatusChanged', {
        showId,
        seats: allSeats,
        lockedSeats: seatNumbers,
        lockedBy: userId,
      });
    }

    return {
      success: true,
      message: `Seats ${seatNumbers.join(', ')} locked for 5 minutes.`,
      expiresAt: new Date(now.getTime() + LOCK_DURATION_MS),
    };
  } catch (error) {
    await transaction.rollback();
    console.error('Lock seats transaction error:', error);
    return { success: false, message: error.message };
  }
};

const releaseSeats = async (showId, seatNumbers, userId) => {
  try {
    const show = await Show.findByPk(showId);
    if (!show) return { success: false, message: 'Show not found.' };

    const physicalSeats = await Seat.findAll({
      where: {
        screenId: show.screenId,
        seatNumber: { [Op.in]: seatNumbers },
      },
    });

    const seatIds = physicalSeats.map((s) => s.id);

    const showSeats = await ShowSeat.findAll({
      where: {
        showId,
        seatId: { [Op.in]: seatIds },
        lockedBy: userId,
        status: 'LOCKED',
      },
    });

    for (const ss of showSeats) {
      ss.status = 'AVAILABLE';
      ss.lockedBy = null;
      ss.lockedAt = null;
      await ss.save();
    }

    if (ioInstance) {
      const allSeats = await getShowSeatsFormatted(showId);
      ioInstance.to(`show_${showId}`).emit('seatStatusChanged', {
        showId,
        seats: allSeats,
        releasedSeats: seatNumbers,
      });
    }

    return { success: true, message: 'Seats released.' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  initSeatLocking,
  lockSeats,
  releaseSeats,
  releaseExpiredLocks,
  getShowSeatsFormatted,
};
