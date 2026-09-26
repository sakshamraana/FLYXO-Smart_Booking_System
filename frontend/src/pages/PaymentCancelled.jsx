import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { requestGraphQL } from '../utils/graphqlClient';
import { XCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';

const VERIFY_CANCEL_QUERY = `
  query VerifyCancelSession($sessionId: String!) {
    bookingBySession(sessionId: $sessionId) {
      id
      showId
      status
      paymentStatus
      show {
        id
        screen
        movie {
          title
        }
      }
    }
  }
`;

const PaymentCancelled = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      requestGraphQL(VERIFY_CANCEL_QUERY, { sessionId })
        .then((data) => setBooking(data.bookingBySession))
        .catch((err) => console.log('Booking by session error:', err.message))
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  const showId = booking?.showId;
  const movieTitle = booking?.show?.movie?.title;

  return (
    <div className="max-w-md mx-auto py-16 px-4 space-y-8 text-center">
      {/* Cancelled Icon */}
      <div className="w-20 h-20 mx-auto rounded-full bg-rose-950/80 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 shadow-2xl shadow-rose-950/50">
        <XCircle size={44} />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-black text-white">Payment Cancelled</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Your Stripe Checkout session was cancelled or abandoned. The booking was not confirmed and any temporary seat locks have been released.
        </p>

        {movieTitle && (
          <p className="text-xs text-rose-400 font-semibold pt-2">
            Show: {movieTitle} ({booking.show?.screen})
          </p>
        )}
      </div>

      {/* Action Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        {showId ? (
          <button
            onClick={() => navigate(`/booking/${showId}`)}
            className="py-3 px-6 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw size={16} />
            Try Booking Seats Again
          </button>
        ) : (
          <Link
            to="/movies"
            className="py-3 px-6 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw size={16} />
            Browse Movies & Shows
          </Link>
        )}

        <Link
          to="/"
          className="py-3 px-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
        >
          <Home size={16} />
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default PaymentCancelled;
