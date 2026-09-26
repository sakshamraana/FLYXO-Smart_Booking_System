import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestGraphQL } from '../utils/graphqlClient';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { toast } from 'react-toastify';
import { Armchair, ShieldCheck, Ticket, CreditCard, Clock, ArrowLeft, AlertCircle } from 'lucide-react';

const SHOW_SEATS_QUERY = `
  query GetShowAndSeats($showId: ID!) {
    show(id: $showId) {
      id
      showDate
      showTime
      screen
      price
      movie {
        id
        title
        genre
        rating
        minimumAge
        thumbnail
      }
    }
    seats(showId: $showId) {
      id
      showId
      seatNumber
      row
      status
      lockedBy
      lockedAt
    }
  }
`;

const LOCK_SEATS_MUTATION = `
  mutation LockSeats($showId: ID!, $seats: [String!]!) {
    lockSeats(showId: $showId, seats: $seats) {
      success
      message
      expiresAt
    }
  }
`;

const RELEASE_SEATS_MUTATION = `
  mutation ReleaseSeats($showId: ID!, $seats: [String!]!) {
    releaseSeats(showId: $showId, seats: $seats) {
      success
      message
    }
  }
`;

const CREATE_CHECKOUT_SESSION_MUTATION = `
  mutation CreateCheckoutSession($input: BookingInput!) {
    createCheckoutSession(input: $input) {
      sessionId
      checkoutUrl
      bookingId
    }
  }
`;

const BookingPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [idProofType, setIdProofType] = useState('AADHAR');
  const [idProofNumber, setIdProofNumber] = useState('');

  const [lockTimeLeft, setLockTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestGraphQL(SHOW_SEATS_QUERY, { showId });
      setShow(data.show);
      setSeats(data.seats || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showId]);

  // Countdown timer effect for locked seats
  useEffect(() => {
    let timer = null;
    if (lockTimeLeft !== null && lockTimeLeft > 0) {
      timer = setInterval(() => {
        setLockTimeLeft((prev) => {
          if (prev <= 1) {
            toast.warning('Seat lock session expired. Please re-select your seats.');
            setSelectedSeats([]);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockTimeLeft]);

  const handleSeatToggle = async (seat) => {
    const seatNum = seat.seatNumber;

    if (selectedSeats.includes(seatNum)) {
      // Release seat lock
      const newSelected = selectedSeats.filter((s) => s !== seatNum);
      setSelectedSeats(newSelected);

      try {
        await requestGraphQL(RELEASE_SEATS_MUTATION, {
          showId,
          seats: [seatNum],
        });
      } catch (err) {
        console.error('Seat release error:', err.message);
      }

      if (newSelected.length === 0) {
        setLockTimeLeft(null);
      }
    } else {
      // Lock seat
      if (selectedSeats.length >= 6) {
        toast.info('Maximum 6 seats allowed per booking transaction.');
        return;
      }

      const newSelected = [...selectedSeats, seatNum];
      try {
        const res = await requestGraphQL(LOCK_SEATS_MUTATION, {
          showId,
          seats: newSelected,
        });

        if (res.lockSeats.success) {
          setSelectedSeats(newSelected);
          setLockTimeLeft(300); // 5 minutes lock countdown
          toast.success(`Seat ${seatNum} locked temporarily for 5 mins.`);
        } else {
          toast.error(res.lockSeats.message);
        }
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat to book.');
      return;
    }

    if (!idProofNumber.trim()) {
      toast.warning('Please enter a valid government ID proof number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await requestGraphQL(CREATE_CHECKOUT_SESSION_MUTATION, {
        input: {
          showId,
          seats: selectedSeats,
          idProofType,
          idProofNumber: idProofNumber.trim(),
        },
      });

      if (res.createCheckoutSession && res.createCheckoutSession.checkoutUrl) {
        toast.info('Redirecting to Stripe Checkout...');
        window.location.href = res.createCheckoutSession.checkoutUrl;
      } else {
        throw new Error('Failed to generate Stripe checkout session URL.');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading theater seating map..." />;
  if (error && !show) return <ErrorMessage message={error} onRetry={fetchData} />;

  const movie = show?.movie;
  const totalAmount = selectedSeats.length * (show?.price || 0);

  const isAgeRestricted = user && movie && user.age < movie.minimumAge;

  return (
    <div className="space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="text-right">
          <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">{movie?.genre}</span>
          <h1 className="text-xl font-bold text-white">{movie?.title}</h1>
          <p className="text-xs text-slate-400">
            {show?.screen} • {show?.showDate} at {show?.showTime}
          </p>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Age restriction blocking alert */}
      {isAgeRestricted && (
        <div className="p-5 bg-rose-950/80 border-2 border-rose-600 rounded-2xl flex items-center gap-4 text-rose-200 text-sm shadow-xl">
          <AlertCircle size={32} className="text-rose-500 shrink-0" />
          <div>
            <h4 className="font-bold text-base text-white">Age Restriction Alert!</h4>
            <p>
              This movie requires viewers to be at least {movie.minimumAge} years old. Your registered account age is {user.age}.
              The backend will reject booking creation for under-age accounts.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Seat Map (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <SeatMap
            showId={showId}
            seats={seats}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
            lockTimeLeft={lockTimeLeft}
          />
        </div>

        {/* Booking Summary & ID Proof Form (1 Column) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Ticket className="text-rose-500" size={20} />
              Booking Summary
            </h3>

            {/* Movie Quick Info */}
            <div className="flex gap-4 items-center">
              <img
                src={movie?.thumbnail}
                alt={movie?.title}
                className="w-16 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
              />
              <div className="text-xs space-y-1">
                <span className="font-bold text-white text-sm block">{movie?.title}</span>
                <p className="text-slate-400">{show?.screen}</p>
                <p className="text-slate-400">{show?.showDate} | {show?.showTime}</p>
                <p className="text-rose-400 font-semibold">₹{show?.price} / seat</p>
              </div>
            </div>

            {/* Selected Seats Badge List */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Selected Seats ({selectedSeats.length})
              </label>
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seatNum) => (
                    <span
                      key={seatNum}
                      className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1"
                    >
                      <Armchair size={12} />
                      {seatNum}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Click on available seats in the map to select.</p>
              )}
            </div>

            {/* Total Amount Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Total Payable Amount</span>
              <span className="text-2xl font-black text-emerald-400">₹{totalAmount.toFixed(2)}</span>
            </div>

            {/* ID Proof Verification Form */}
            <form onSubmit={handleConfirmBooking} className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-amber-500" />
                Government ID Proof Verification
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ID Document Type</label>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="AADHAR">Aadhar Card (12 Digits)</option>
                  <option value="PAN">PAN Card (e.g. ABCDE1234F)</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="PASSPORT">Passport (e.g. A1234567)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ID Proof Number</label>
                <input
                  type="text"
                  required
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  placeholder={
                    idProofType === 'AADHAR'
                      ? '123456789012'
                      : idProofType === 'PAN'
                      ? 'ABCDE1234F'
                      : idProofType === 'PASSPORT'
                      ? 'A1234567'
                      : 'DL-1420110012345'
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || selectedSeats.length === 0 || isAgeRestricted}
                className={`w-full py-3.5 rounded-2xl font-bold text-white transition flex items-center justify-center gap-2 shadow-lg ${
                  submitting || selectedSeats.length === 0 || isAgeRestricted
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 shadow-rose-600/30'
                }`}
              >
                {submitting ? (
                  <span>Redirecting to Stripe...</span>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Pay with Stripe</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
