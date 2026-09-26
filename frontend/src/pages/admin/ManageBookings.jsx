import React, { useEffect, useState } from 'react';
import { requestGraphQL } from '../../utils/graphqlClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { toast } from 'react-toastify';
import { Ticket, Filter, Download, XCircle, CheckCircle, Search } from 'lucide-react';

const ALL_BOOKINGS_QUERY = `
  query GetAllBookings {
    allBookings {
      id
      bookingReference
      totalAmount
      seats
      idProofType
      idProofNumber
      status
      paymentStatus
      stripeSessionId
      stripePaymentIntentId
      createdAt
      user {
        name
        email
        phone
      }
      show {
        showDate
        showTime
        screen
        movie {
          title
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
    }
  }
`;

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [cancellingBooking, setCancellingBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestGraphQL(ALL_BOOKINGS_QUERY);
      setBookings(data.allBookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async () => {
    if (!cancellingBooking) return;
    try {
      await requestGraphQL(CANCEL_BOOKING_MUTATION, { id: cancellingBooking.id });
      toast.success(`Booking ${cancellingBooking.bookingReference} cancelled by admin.`);
      setCancellingBooking(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchesSearch =
      b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.show?.movie?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.stripeSessionId && b.stripeSessionId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) return <LoadingSpinner message="Loading Master Bookings..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBookings} />;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Ticket className="text-rose-500" size={32} />
            Master Bookings Management
          </h1>
          <p className="text-slate-400 text-sm">View, audit, download PDF, or process booking cancellations.</p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search reference, customer, movie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterStatus === st
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Movie & Show</th>
                <th className="p-3">Seats</th>
                <th className="p-3">ID Proof</th>
                <th className="p-3">Total Paid</th>
                <th className="p-3">Booking Status</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredBookings.map((b) => {
                const seatsStr = Array.isArray(b.seats) ? b.seats.join(', ') : b.seats;
                const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tickets/${b.bookingReference}/pdf`;
                return (
                  <tr key={b.id} className="hover:bg-slate-850 transition">
                    <td className="p-3 font-mono text-rose-400 font-bold">{b.bookingReference}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-200">{b.user?.name}</div>
                      <div className="text-[10px] text-slate-500">{b.user?.phone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{b.show?.movie?.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {b.show?.showDate} {b.show?.showTime} ({b.show?.screen})
                      </div>
                    </td>
                    <td className="p-3 font-bold text-slate-200">{seatsStr}</td>
                    <td className="p-3 font-mono text-[11px]">
                      {b.idProofType}: {b.idProofNumber}
                    </td>
                    <td className="p-3 font-black text-emerald-400">₹{b.totalAmount}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : b.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          b.paymentStatus === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : b.paymentStatus === 'PENDING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : b.paymentStatus === 'REFUNDED'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                          title="Download PDF Ticket"
                        >
                          <Download size={14} />
                        </a>
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setCancellingBooking(b)}
                            className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg transition"
                            title="Cancel Booking"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        onConfirm={handleCancel}
        title="Admin Booking Cancellation"
        message={`Are you sure you want to cancel booking ${cancellingBooking?.bookingReference}?`}
        confirmText="Cancel Booking"
        isDangerous={true}
      />
    </div>
  );
};

export default ManageBookings;
