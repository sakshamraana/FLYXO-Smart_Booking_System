import React, { useEffect, useState } from 'react';
import { requestGraphQL } from '../../utils/graphqlClient';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { toast } from 'react-toastify';
import { Calendar, Plus, Trash2, Monitor, Clock, Armchair, Building2 } from 'lucide-react';

const ADMIN_SHOWS_QUERY = `
  query GetAdminShows($theatreId: ID!) {
    showsByTheatre(theatreId: $theatreId) {
      id
      movieId
      showDate
      showTime
      screen
      language
      format
      totalSeats
      availableSeats
      price
      isActive
      movie {
        id
        title
      }
    }
    screens(theatreId: $theatreId) {
      id
      name
      screenNumber
      screenType
      totalSeats
    }
    movies {
      id
      title
    }
    theatres {
      id
      name
      city
    }
  }
`;

const CREATE_SHOW_MUTATION = `
  mutation CreateShow($input: ShowInput!) {
    createShow(input: $input) {
      id
      showDate
      showTime
      screen
    }
  }
`;

const DELETE_SHOW_MUTATION = `
  mutation DeleteShow($id: ID!) {
    deleteShow(id: $id)
  }
`;

const ManageShows = () => {
  const { user, theatreId } = useAuth();
  const [shows, setShows] = useState([]);
  const [screens, setScreens] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState(theatreId || '1');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingShowId, setDeletingShowId] = useState(null);

  const [formData, setFormData] = useState({
    movieId: '',
    screenId: '',
    showDate: new Date().toISOString().split('T')[0],
    showTime: '18:00',
    language: 'English',
    format: '2D',
    price: 200,
  });

  const fetchData = async () => {
    const tId = user?.role === 'SUPER_ADMIN' ? selectedTheatreId : (theatreId || '1');

    setLoading(true);
    setError(null);
    try {
      const data = await requestGraphQL(ADMIN_SHOWS_QUERY, { theatreId: tId });
      setShows(data.showsByTheatre || []);
      setScreens(data.screens || []);
      setMovies(data.movies || []);
      setTheatres(data.theatres || []);

      setFormData((prev) => ({
        ...prev,
        movieId: prev.movieId || (data.movies?.[0]?.id || ''),
        screenId: prev.screenId || (data.screens?.[0]?.id || ''),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTheatreId, theatreId]);

  const handleCreateShow = async (e) => {
    e.preventDefault();
    const tId = user?.role === 'SUPER_ADMIN' ? selectedTheatreId : (theatreId || '1');

    if (!formData.movieId) {
      toast.warning('Please select a movie.');
      return;
    }
    if (!formData.screenId) {
      toast.warning('Please select a screen.');
      return;
    }

    try {
      await requestGraphQL(CREATE_SHOW_MUTATION, {
        input: {
          movieId: formData.movieId,
          theatreId: tId,
          screenId: formData.screenId,
          showDate: formData.showDate,
          showTime: formData.showTime,
          language: formData.language,
          format: formData.format,
          price: parseFloat(formData.price),
        },
      });

      toast.success('New show created and seating status generated!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteShow = async () => {
    if (!deletingShowId) return;
    try {
      await requestGraphQL(DELETE_SHOW_MUTATION, { id: deletingShowId });
      toast.success('Show deleted successfully.');
      setDeletingShowId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Scheduled Shows..." />;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Calendar className="text-rose-500" size={32} />
            Manage Shows & Schedules
          </h1>
          <p className="text-slate-400 text-xs">
            Schedule showtimes for auditoriums. ShowSeats are automatically generated for every screen seat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'SUPER_ADMIN' && (
            <select
              value={selectedTheatreId}
              onChange={(e) => setSelectedTheatreId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2"
            >
              {theatres.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.city})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            Schedule New Show
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Shows Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Movie</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Screen & Format</th>
                <th className="p-3">Language</th>
                <th className="p-3">Available Seats</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {shows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-850 transition">
                  <td className="p-3 font-bold text-white text-sm">{s.movie?.title}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{s.showDate}</div>
                    <div className="text-[10px] text-slate-500">{s.showTime}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-amber-400 rounded font-semibold">
                      {s.screen} ({s.format})
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 font-medium">{s.language}</td>
                  <td className="p-3">
                    <span className="font-bold text-rose-400">
                      {s.availableSeats} / {s.totalSeats} seats
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setDeletingShowId(s.id)}
                      className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg transition"
                      title="Delete Show"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Show Modal */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)} title="Schedule New Show">
          <form onSubmit={handleCreateShow} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Select Movie</label>
              <select
                value={formData.movieId}
                onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Select Screen</label>
              <select
                value={formData.screenId}
                onChange={(e) => setFormData({ ...formData, screenId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                {screens.map((scr) => (
                  <option key={scr.id} value={scr.id}>
                    {scr.name} ({scr.screenType} - {scr.totalSeats} Seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Show Date</label>
                <input
                  type="date"
                  required
                  value={formData.showDate}
                  onChange={(e) => setFormData({ ...formData, showDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Show Time Slot</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 06:15 PM"
                  value={formData.showTime}
                  onChange={(e) => setFormData({ ...formData, showTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Language</label>
                <input
                  type="text"
                  required
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Format</label>
                <input
                  type="text"
                  required
                  placeholder="2D, IMAX 3D, 4DX"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Schedule Show
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmationDialog
        isOpen={!!deletingShowId}
        onClose={() => setDeletingShowId(null)}
        onConfirm={handleDeleteShow}
        title="Delete Show Slot"
        message="Are you sure you want to delete this showtime slot? ShowSeat availability records will be deleted."
        confirmText="Delete Show"
        isDangerous={true}
      />
    </div>
  );
};

export default ManageShows;
