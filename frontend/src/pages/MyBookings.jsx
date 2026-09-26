import React, { useEffect, useState } from 'react';
import { requestGraphQL } from '../utils/graphqlClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { toast } from 'react-toastify';
import { Ticket, Calendar, Clock, Monitor, Download, XCircle, CheckCircle, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MY_BOOKINGS_QUERY = `
  query GetMyBookings {
    myBookings {
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
    }
  }
`;

const CANCEL_BOOKING_MUTATION = `
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      id
      status
      paymentStatus
    }
  }
`;

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestGraphQL(MY_BOOKINGS_QUERY);
      setBookings(data.myBookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      await requestGraphQL(CANCEL_BOOKING_MUTATION, { id: bookingToCancel.id });
      toast.success(`Booking ${bookingToCancel.bookingReference} cancelled. Seats released.`);
      setBookingToCancel(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching your bookings..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBookings} />;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Ticket className="text-rose-500" size={32} />
            My Ticket Bookings
          </h1>
          <p className="text-slate-400 text-sm">View, download PDF tickets, or manage your cinema bookings.</p>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const show = booking.show;
            const movie = show?.movie;
            const seatsList = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;
            const isCancelled = booking.status === 'CANCELLED';
            const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/${booking.bookingReference}/pdf`;

            return (
              <div
                key={booking.id}
                className={`bg-slate-900 border rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition ${
                  isCancelled ? 'border-slate-800 opacity-70' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Poster & Movie details */}
                <div className="flex items-center gap-4">
                  <img
                    src={movie?.thumbnail}
                    alt={movie?.title}
                    className="w-20 h-28 rounded-2xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded">
                        {movie?.genre}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isCancelled ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white">{movie?.title}</h3>
                    <p className="text-xs text-slate-400 font-mono">Ref: {booking.bookingReference}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar size={14} className="text-rose-500" />
                        {show?.showDate} at {show?.showTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Monitor size={14} className="text-amber-500" />
                        {show?.screen}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seat breakdown & Pricing */}
                <div className="flex flex-col md:items-end justify-between space-y-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800 w-full md:w-auto">
                  <div>
                    <span className="text-xs text-slate-400 block">Reserved Seats:</span>
                    <span className="text-lg font-black text-rose-400">{seatsList}</span>
                  </div>

                  <span className="text-xl font-extrabold text-emerald-400">₹{booking.totalAmount.toFixed(2)}</span>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    {!isCancelled && (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Download size={14} />
                        PDF Ticket
                      </a>
                    )}

                    {!isCancelled && (
                      <button
                        onClick={() => setBookingToCancel(booking)}
                        className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <XCircle size={14} />
                        Cancel Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Bookings Yet"
          message="You haven't booked any movie tickets yet. Browse our movies to make your first booking!"
          actionText="Browse Movies"
          onAction={() => navigate('/')}
        />
      )}

      {/* Cancellation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Ticket Booking"
        message={`Are you sure you want to cancel booking ${bookingToCancel?.bookingReference}? This will release the seats and initiate a refund.`}
        confirmText={cancelling ? 'Cancelling...' : 'Cancel Booking'}
        isDangerous={true}
      />
    </div>
  );
};

export default MyBookings;
