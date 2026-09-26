import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { requestGraphQL } from '../utils/graphqlClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { CheckCircle, Download, Ticket, Calendar, Clock, Monitor, Armchair, ArrowRight } from 'lucide-react';

const BOOKING_QUERY = `
  query GetBooking($id: ID!) {
    booking(id: $id) {
      id
      bookingReference
      totalAmount
      seats
      idProofType
      idProofNumber
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
      }
      user {
        name
        email
        phone
      }
    }
  }
`;

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestGraphQL(BOOKING_QUERY, { id: bookingId });
      setBooking(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  if (loading) return <LoadingSpinner message="Fetching booking confirmation..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBooking} />;
  if (!booking) return null;

  const isConfirmed = booking.status === 'CONFIRMED' && booking.paymentStatus === 'COMPLETED';
  const isPending = booking.paymentStatus === 'PENDING' || booking.status === 'PENDING';

  const show = booking.show;
  const movie = show?.movie;
  const seatsList = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;

  const downloadPdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/${booking.bookingReference}/pdf`;

  if (isPending) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 space-y-6 text-center">
        <div className="p-8 bg-slate-900 border border-amber-500/40 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-950/80 border-2 border-amber-500 flex items-center justify-center text-amber-400">
            <Ticket size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Payment verification in progress...</h2>
          <p className="text-slate-400 text-sm">
            Your booking reference is <span className="font-mono text-amber-400">{booking.bookingReference}</span>, but the payment confirmation has not been completed yet.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={fetchBooking}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition"
            >
              Refresh Status
            </button>
            <Link
              to="/my-bookings"
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isConfirmed) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 space-y-6 text-center">
        <div className="p-8 bg-slate-900 border border-rose-500/40 rounded-3xl space-y-4 shadow-2xl">
          <h2 className="text-2xl font-bold text-white">Booking Not Confirmed</h2>
          <p className="text-slate-400 text-sm">
            This booking status is <span className="font-bold text-rose-400">{booking.status}</span> with payment status <span className="font-bold text-rose-400">{booking.paymentStatus}</span>.
          </p>
          <Link
            to="/my-bookings"
            className="inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition"
          >
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      {/* Success Badge Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/50">
          <CheckCircle size={36} />
        </div>
        <h1 className="text-3xl font-black text-white">Booking Confirmed!</h1>
        <p className="text-slate-400 text-sm">Your seats have been permanently booked and confirmed.</p>
      </div>

      {/* Ticket Card Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header Bar */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 block">
              BOOKING REFERENCE
            </span>
            <span className="text-xl font-black text-white tracking-wide">{booking.bookingReference}</span>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs rounded-lg">
            {booking.status}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Movie Info Grid */}
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
              <span className="text-slate-500 font-semibold block">DATE & TIME</span>
              <span className="font-bold text-slate-200">{show?.showDate} at {show?.showTime}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">SCREEN / THEATER</span>
              <span className="font-bold text-slate-200">{show?.screen}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">PASSENGER NAME</span>
              <span className="font-bold text-slate-200">{booking.user?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">ID PROOF VERIFIED</span>
              <span className="font-bold text-slate-200">{booking.idProofType}: {booking.idProofNumber}</span>
            </div>
          </div>

          {/* Reserved Seats Highlight */}
          <div className="p-5 bg-gradient-to-r from-rose-950/40 to-slate-950 border border-rose-500/30 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">RESERVED SEATS</span>
              <span className="text-2xl font-black text-rose-400">{seatsList}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 block">TOTAL PAID</span>
              <span className="text-xl font-black text-emerald-400">₹{booking.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* PDF Download Button */}
          <div className="pt-2">
            <a
              href={downloadPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download Official PDF Ticket
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-center gap-4">
        <Link
          to="/my-bookings"
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-sm rounded-xl transition flex items-center gap-2"
        >
          <Ticket size={16} />
          View All My Bookings
        </Link>
        <Link
          to="/"
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-sm rounded-xl transition flex items-center gap-2"
        >
          Book Another Movie
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
