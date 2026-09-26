import React, { useEffect, useState } from 'react';
import { requestGraphQL } from '../../utils/graphqlClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { toast } from 'react-toastify';
import { Film, Plus, Edit2, Trash2, Power, Eye } from 'lucide-react';

const ADMIN_MOVIES_QUERY = `
  query GetAdminMovies {
    movies(includeInactive: true) {
      id
      title
      description
      genre
      duration
      language
      rating
      minimumAge
      thumbnail
      releaseDate
      isActive
    }
  }
`;

const CREATE_MOVIE_MUTATION = `
  mutation CreateMovie($input: MovieInput!) {
    createMovie(input: $input) {
      id
      title
    }
  }
`;

const UPDATE_MOVIE_MUTATION = `
  mutation UpdateMovie($id: ID!, $input: MovieInput!) {
    updateMovie(id: $id, input: $input) {
      id
      title
    }
  }
`;

const DELETE_MOVIE_MUTATION = `
  mutation DeleteMovie($id: ID!) {
    deleteMovie(id: $id)
  }
`;

const TOGGLE_MOVIE_STATUS_MUTATION = `
  mutation ToggleMovieStatus($id: ID!) {
    toggleMovieStatus(id: $id) {
      id
      isActive
    }
  }
`;

const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [deletingMovieId, setDeletingMovieId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    duration: 120,
    language: 'English',
    rating: 'UA',
    minimumAge: 13,
    thumbnail: '',
    releaseDate: '',
  });

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestGraphQL(ADMIN_MOVIES_QUERY);
      setMovies(data.movies || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleOpenAddModal = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      genre: 'Action / Sci-Fi',
      duration: 120,
      language: 'English',
      rating: 'UA',
      minimumAge: 13,
      thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      releaseDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      duration: movie.duration,
      language: movie.language,
      rating: movie.rating,
      minimumAge: movie.minimumAge,
      thumbnail: movie.thumbnail,
      releaseDate: movie.releaseDate,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const input = {
        ...formData,
        duration: parseInt(formData.duration, 10),
        minimumAge: parseInt(formData.minimumAge, 10),
      };

      if (editingMovie) {
        await requestGraphQL(UPDATE_MOVIE_MUTATION, { id: editingMovie.id, input });
        toast.success(`Movie "${formData.title}" updated successfully.`);
      } else {
        await requestGraphQL(CREATE_MOVIE_MUTATION, { input });
        toast.success(`Movie "${formData.title}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchMovies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await requestGraphQL(TOGGLE_MOVIE_STATUS_MUTATION, { id });
      toast.info('Movie status updated.');
      fetchMovies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteMovie = async () => {
    if (!deletingMovieId) return;
    try {
      await requestGraphQL(DELETE_MOVIE_MUTATION, { id: deletingMovieId });
      toast.success('Movie deleted successfully.');
      setDeletingMovieId(null);
      fetchMovies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Movies list..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchMovies} />;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Film className="text-rose-500" size={32} />
            Manage Movies
          </h1>
          <p className="text-slate-400 text-sm">Add, edit, deactivate, or delete movies from the platform.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Movie
        </button>
      </div>

      {/* Movies Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Poster & Title</th>
                <th className="p-3">Genre & Language</th>
                <th className="p-3">Rating & Min Age</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {movies.map((m) => (
                <tr key={m.id} className="hover:bg-slate-850 transition">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={m.thumbnail} alt={m.title} className="w-10 h-12 object-cover rounded-lg border border-slate-800" />
                      <div>
                        <span className="font-bold text-white text-sm block">{m.title}</span>
                        <span className="text-[10px] text-slate-500">Release: {m.releaseDate}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{m.genre}</div>
                    <div className="text-[10px] text-slate-500">{m.language}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold">
                      {m.rating} ({m.minimumAge}+)
                    </span>
                  </td>
                  <td className="p-3 font-semibold">{m.duration} mins</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleStatus(m.id)}
                      className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase flex items-center gap-1 transition ${
                        m.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Power size={10} />
                      {m.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Edit Movie"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingMovieId(m.id)}
                        className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg transition"
                        title="Delete Movie"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Movie Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMovie ? 'Edit Movie Details' : 'Add New Movie'}
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Movie Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description</label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Genre</label>
              <input
                type="text"
                required
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Language</label>
              <input
                type="text"
                required
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Duration (Mins)</label>
              <input
                type="number"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Rating</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="U">U (General)</option>
                <option value="UA">UA (Parental Guidance)</option>
                <option value="A">A (Adults Only)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Minimum Age</label>
              <input
                type="number"
                required
                value={formData.minimumAge}
                onChange={(e) => setFormData({ ...formData, minimumAge: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Poster Thumbnail URL</label>
            <input
              type="url"
              required
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Release Date</label>
            <input
              type="date"
              required
              value={formData.releaseDate}
              onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg"
            >
              Save Movie
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingMovieId}
        onClose={() => setDeletingMovieId(null)}
        onConfirm={handleDeleteMovie}
        title="Delete Movie"
        message="Are you sure you want to delete this movie? All scheduled shows for this movie will also be deleted."
        confirmText="Delete Movie"
        isDangerous={true}
      />
    </div>
  );
};

export default ManageMovies;
