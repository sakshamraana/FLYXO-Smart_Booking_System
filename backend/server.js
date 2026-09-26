const express = require('express');
const http = require('http');
const cors = require('cors');
const { createHandler } = require('graphql-http/lib/use/express');
require('dotenv').config();

const { sequelize, Booking, Show, Movie, User, Payment } = require('./models');
const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const authMiddleware = require('./middleware/auth');
const { initSeatLocking, lockSeats, releaseSeats } = require('./utils/seatLock');
const { generatePDFTicket } = require('./utils/pdfTicket');
const stripeService = require('./services/stripeService');
const runDbMigrations = require('./utils/dbMigration');
const { confirmBookingAndPayment, failBookingAndReleaseSeats } = require('./services/bookingPaymentService');

const app = express();
const server = http.createServer(app);

// Socket.io initialization
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

global.io = io;
initSeatLocking(io);

// Express Middleware
app.use(cors());

// Stripe Webhook Route (MUST receive raw body BEFORE express.json())
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
      event = stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
      console.error('[Stripe Webhook Error] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Signature Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const bookingId = session.metadata && session.metadata.bookingId;
          const paymentIntentId = session.payment_intent;

          if (bookingId) {
            console.log(`[Stripe Webhook] Processing checkout.session.completed for Booking ID ${bookingId}`);
            await confirmBookingAndPayment(bookingId, paymentIntentId);
          }
          break;
        }

        case 'checkout.session.expired': {
          const session = event.data.object;
          const bookingId = session.metadata && session.metadata.bookingId;
          if (bookingId) {
            console.log(`[Stripe Webhook] Processing checkout.session.expired for Booking ID ${bookingId}`);
            await failBookingAndReleaseSeats(bookingId);
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          console.log(`[Stripe Webhook] PaymentIntent failed: ${paymentIntent.id}`);
          if (paymentIntent.metadata && paymentIntent.metadata.bookingId) {
            await failBookingAndReleaseSeats(paymentIntent.metadata.bookingId);
          }
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error('[Stripe Webhook Error] Event processing failed:', err.message);
      res.status(500).send(`Webhook Handler Error: ${err.message}`);
    }
  }
);

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CineBook Backend API is operational.' });
});

// PDF Ticket Download Route
app.get('/api/tickets/:bookingRef/pdf', async (req, res) => {
  try {
    const { bookingRef } = req.params;
    const booking = await Booking.findOne({
      where: { bookingReference: bookingRef },
      include: [
        { model: Show, as: 'show' },
        { model: User, as: 'user' },
      ],
    });

    if (!booking) {
      return res.status(404).send('Booking ticket not found.');
    }

    const movie = await Movie.findByPk(booking.show.movieId);
    generatePDFTicket(booking, booking.show, movie, booking.user, res);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).send('Error generating PDF ticket.');
  }
});

// GraphQL API Handler
app.all(
  '/graphql',
  createHandler({
    schema,
    rootValue: resolvers,
    context: (req) => {
      const user = authMiddleware(req.raw || req);
      return { user };
    },
  })
);

// Socket.io Client Connections
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('joinShowRoom', (showId) => {
    socket.join(`show_${showId}`);
    console.log(`[Socket.io] Socket ${socket.id} joined room show_${showId}`);
  });

  socket.on('leaveShowRoom', (showId) => {
    socket.leave(`show_${showId}`);
    console.log(`[Socket.io] Socket ${socket.id} left room show_${showId}`);
  });

  socket.on('lockSeatRequest', async ({ showId, seats, userId }) => {
    const result = await lockSeats(showId, seats, userId);
    socket.emit('lockSeatResponse', result);
  });

  socket.on('releaseSeatRequest', async ({ showId, seats, userId }) => {
    const result = await releaseSeats(showId, seats, userId);
    socket.emit('releaseSeatResponse', result);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Sync database, run migrations, and start server
sequelize
  .sync({ alter: false })
  .then(async () => {
    console.log('Database synced successfully.');
    await runDbMigrations(sequelize, Payment);
    server.listen(PORT, () => {
      console.log(`>>> CineBook Server running on http://localhost:${PORT}`);
      console.log(`>>> GraphQL Endpoint: http://localhost:${PORT}/graphql`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err.message);
  });

