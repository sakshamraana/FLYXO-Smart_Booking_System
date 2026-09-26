import React, { useEffect, useState } from 'react';
import { requestGraphQL } from '../../utils/graphqlClient';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { Users, Film, Calendar, Ticket, DollarSign, ShieldAlert, ArrowRight, Monitor, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const DASHBOARD_STATS_QUERY = `
  query GetDashboardStats($theatreId: ID) {
    dashboardStats(theatreId: $theatreId) {
      totalUsers
      totalMovies
      activeShows
      totalBookings
      totalRevenue
      recentBookings {
        id
        bookingReference
        totalAmount
        seats
        status
        createdAt
        user {
          name
          email
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
  }
`;

const AdminDashboard = () => {
  const { user, theatreId } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestGraphQL(DASHBOARD_STATS_QUERY, {
        theatreId: user?.role === 'ADMIN' ? theatreId : null,
      });
      setStats(data.dashboardStats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [theatreId]);

  if (loading) return <LoadingSpinner message="Loading Theatre Admin Operations & Analytics..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchStats} />;
  if (!stats) return null;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
              <Building2 size={12} />
              {user?.theatre ? user.theatre.name : 'Theatre Operations'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="text-amber-500" size={32} />
            Theatre Admin Portal
          </h1>
          <p className="text-slate-400 text-xs">
            Manage auditoriums, screens, custom seat layouts, and shows for {user?.theatre?.name || 'your assigned cinema'}.
          </p>
        </div>

        {/* Admin Navigation Quick Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/screens"
            className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition"
          >
            <Monitor size={15} />
            Screens & Custom Seats
          </Link>
          <Link
            to="/admin/movies"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Movies
          </Link>
          <Link
            to="/admin/shows"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Shows
          </Link>
          <Link
            to="/admin/bookings"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Bookings
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Film size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Movies</span>
            <span className="text-2xl font-black text-white">{stats.totalMovies}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Active Shows</span>
            <span className="text-2xl font-black text-white">{stats.activeShows}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <Ticket size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Theatre Bookings</span>
            <span className="text-2xl font-black text-white">{stats.totalBookings}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Theatre Revenue</span>
            <span className="text-2xl font-black text-emerald-400">₹{stats.totalRevenue.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Ticket className="text-rose-500" size={20} />
            Recent Theatre Booking Transactions
          </h3>
          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
          >
            View All Bookings
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Movie & Show</th>
                <th className="p-3">Seats</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {stats.recentBookings.map((b) => {
                const seatsStr = Array.isArray(b.seats) ? b.seats.join(', ') : b.seats;
                return (
                  <tr key={b.id} className="hover:bg-slate-850 transition">
                    <td className="p-3 font-mono text-rose-400 font-semibold">{b.bookingReference}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{b.user?.name}</div>
                      <div className="text-[10px] text-slate-500">{b.user?.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-200">{b.show?.movie?.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {b.show?.showDate} {b.show?.showTime} ({b.show?.screen})
                      </div>
                    </td>
                    <td className="p-3 font-bold text-slate-200">{seatsStr}</td>
                    <td className="p-3 font-extrabold text-emerald-400">₹{b.totalAmount}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
