import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { requestGraphQL } from '../utils/graphqlClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { CheckCircle, AlertTriangle, ArrowRight, Download, Ticket, Film, Building, Monitor, Armchair, RefreshCw } from 'lucide-react';

const VERIFY_PAYMENT_QUERY = `
  query VerifyPaymentSession($sessionId: String!) {
    verifyPaymentSession(sessionId: $sessionId) {
      id
      bookingReference
      totalAmount
      seats
      status
      paymentStatus
      createdAt
      show {
        id
        showDate
        showTime
        screen
        movie {
          id
          title
          genre
          language
          rating
          thumbnail
        }
        theatre {
          name
          city
        }
      }
      user {
        name
        email
      }
    }
  }
`;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const verifyPayment = async () => {
    if (!sessionId) {
      setError('Missing Stripe checkout session ID in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await requestGraphQL(VERIFY_PAYMENT_QUERY, { sessionId });
      setBooking(data.verifyPaymentSession);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [sessionId, retryCount]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner message="Verifying payment confirmation with Stripe & backend..." />
        <p className="text-xs text-slate-500">Please do not refresh or leave this page.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 space-y-6 text-center">
        <ErrorMessage message={error} />
        <button
          onClick={() => setRetryCount((prev) => prev + 1)}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl transition inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Retry Payment Verification
        </button>
      </div>
    );
  }

  if (!booking) return null;

  const isCompleted = booking.paymentStatus === 'COMPLETED' && booking.status === 'CONFIRMED';
  const show = booking.show;
  const movie = show?.movie;
  const theatre = show?.theatre;
  const seatsList = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;
  const downloadPdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/${booking.bookingReference}/pdf`;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      {isCompleted ? (
        <>
          {/* Success Banner Header */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-950/90 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-950/80 animate-bounce">
              <CheckCircle size={44} />
            </div>
            <h1 className="text-3xl font-black text-white">Payment Successful!</h1>
            <p className="text-slate-400 text-sm">
              Your Stripe payment has been verified and your seats are officially confirmed.
            </p>
          </div>

          {/* Ticket Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
            {/* Top Reference Bar */}
            <div className="bg-slate-950 p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 block">
                  BOOKING REFERENCE
                </span>
                <span className="text-xl font-black text-white tracking-wide">{booking.bookingReference}</span>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs rounded-lg">
                  PAYMENT COMPLETED
                </span>
              </div>
            </div>

            {/* Ticket Card Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-5">
                <img
                  src={movie?.thumbnail}
                  alt={movie?.title}
                  className="w-20 h-28 rounded-2xl object-cover border border-slate-800 shrink-0 shadow-lg"
                />
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">{movie?.genre}</span>
                  <h2 className="text-xl font-bold text-white">{movie?.title}</h2>
                  <p className="text-xs text-slate-400">{movie?.language} • Rating: {movie?.rating}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block uppercase">Theatre & City</span>
                  <span className="font-bold text-slate-200">{theatre?.name || 'Theatre'} ({theatre?.city})</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase">Screen / Format</span>
                  <span className="font-bold text-slate-200">{show?.screen}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase">Show Date & Time</span>
                  <span className="font-bold text-slate-200">{show?.showDate} at {show?.showTime}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block uppercase">Customer</span>
                  <span className="font-bold text-slate-200">{booking.user?.name}</span>
                </div>
              </div>

              {/* Reserved Seats Highlight */}
              <div className="p-5 bg-gradient-to-r from-rose-950/40 to-slate-950 border border-rose-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">CONFIRMED SEATS</span>
                  <span className="text-2xl font-black text-rose-400">{seatsList}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">TOTAL AMOUNT PAID</span>
                  <span className="text-2xl font-black text-emerald-400">₹{booking.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to={`/booking-confirmation/${booking.id}`}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-center shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Ticket size={18} />
                  View Final Ticket
                </Link>
                <a
                  href={downloadPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-center border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Pending or Unverified State */
        <div className="bg-slate-900 border border-amber-500/40 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-950/80 border-2 border-amber-500 flex items-center justify-center text-amber-400">
            <AlertTriangle size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Payment Verification In Progress...</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              We received your redirect, but server-side confirmation from Stripe is still processing. Status: <span className="font-bold text-amber-400">{booking.paymentStatus}</span>.
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-4">
            <button
              onClick={() => setRetryCount((prev) => prev + 1)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Check Status Again
            </button>
            <Link
              to="/my-bookings"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition"
            >
              Go to My Bookings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
