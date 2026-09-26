const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

/**
 * Creates a Stripe Checkout Session for a movie ticket booking.
 */
const createCheckoutSession = async ({
  bookingId,
  bookingReference,
  movieTitle,
  theatreName,
  screenName,
  seats,
  totalAmount,
  userEmail,
  showId,
}) => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('xxxxxxxxxxxxxxxxx')) {
    throw new Error('Stripe secret key is not configured in backend environment variables.');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const unitAmountInPaise = Math.round(totalAmount * 100);

  const seatString = Array.isArray(seats) ? seats.join(', ') : seats;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Ticket Booking: ${movieTitle}`,
              description: `${theatreName || 'Theatre'} - ${screenName || 'Screen'} | Seats: ${seatString} | Ref: ${bookingReference}`,
            },
            unit_amount: unitAmountInPaise,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: String(bookingId),
        bookingReference: String(bookingReference),
        showId: String(showId),
      },
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment-cancelled?session_id={CHECKOUT_SESSION_ID}`,
    });

    console.log(`[Stripe] Checkout session created: ${session.id} for Booking ID: ${bookingId}`);
    return session;
  } catch (err) {
    console.error('[Stripe] Error creating checkout session:', err.message);
    throw new Error(`Stripe Checkout Error: ${err.message}`);
  }
};

/**
 * Retrieves an existing Checkout Session from Stripe.
 */
const retrieveCheckoutSession = async (sessionId) => {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error(`[Stripe] Error retrieving session ${sessionId}:`, err.message);
    throw new Error(`Failed to retrieve Stripe session: ${err.message}`);
  }
};

/**
 * Constructs and verifies a Stripe Webhook event using raw request body and signature.
 */
const constructWebhookEvent = (rawBody, signature) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.includes('xxxxxxxxxxxxxxxxx')) {
    throw new Error('Stripe webhook secret is not configured in backend environment variables.');
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
};

/**
 * Creates a refund for a completed Stripe payment intent.
 */
const createRefund = async (paymentIntentId) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    console.log(`[Stripe] Refund issued successfully: ${refund.id} for PaymentIntent: ${paymentIntentId}`);
    return refund;
  } catch (err) {
    console.error(`[Stripe] Error issuing refund for PaymentIntent ${paymentIntentId}:`, err.message);
    throw new Error(`Stripe Refund Error: ${err.message}`);
  }
};

module.exports = {
  createCheckoutSession,
  retrieveCheckoutSession,
  constructWebhookEvent,
  createRefund,
};
