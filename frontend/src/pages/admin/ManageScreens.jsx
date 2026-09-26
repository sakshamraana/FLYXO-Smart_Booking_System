import React, { useState, useEffect } from 'react';
import { requestGraphQL } from '../../utils/graphqlClient';
import { useAuth } from '../../context/AuthContext';
import VisualSeatEditor from './VisualSeatEditor';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import { Monitor, Plus, Armchair, Edit, Trash2, ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const GET_SCREENS_QUERY = `
  query GetScreens($theatreId: ID!) {
    screens(theatreId: $theatreId) {
      id
      theatreId
      name
      screenNumber
      screenType
      totalSeats
      isActive
      seats {
        id
        seatNumber
        row
        seatType
        price
      }
    }
  }
`;

const CREATE_SCREEN_MUTATION = `
  mutation CreateScreen($input: ScreenInput!) {
    createScreen(input: $input) {
      id
      name
      screenNumber
      screenType
      totalSeats
    }
  }
`;

const DELETE_SCREEN_MUTATION = `
  mutation DeleteScreen($id: ID!) {
    deleteScreen(id: $id)
  }
`;

const ManageScreens = () => {
  const { user, theatreId } = useAuth();
  const [screens, setScreens] = useState([]);
  const [editingScreen, setEditingScreen] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [screenNumber, setScreenNumber] = useState('1');
  const [screenType, setScreenType] = useState('STANDARD');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const targetTheatreId = user?.role === 'SUPER_ADMIN' ? (theatreId || '1') : (theatreId || '1');

  const fetchScreens = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestGraphQL(GET_SCREENS_QUERY, { theatreId: targetTheatreId });
      setScreens(data.screens || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreens();
  }, [targetTheatreId]);

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestGraphQL(CREATE_SCREEN_MUTATION, {
        input: {
          theatreId: targetTheatreId,
          name,
          screenNumber: parseInt(screenNumber, 10),
          screenType,
        },
      });
      toast.success(`Screen "${name}" created! Now configure its seating layout.`);
      setShowAddModal(false);
      setName('');
      fetchScreens();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScreen = async (id) => {
    if (!window.confirm('Are you sure you want to delete this screen?')) return;
    try {
      await requestGraphQL(DELETE_SCREEN_MUTATION, { id });
      toast.info('Screen deleted.');
      fetchScreens();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (editingScreen) {
    return (
      <VisualSeatEditor
        screen={editingScreen}
        onSaved={() => {
          setEditingScreen(null);
          fetchScreens();
        }}
        onCancel={() => setEditingScreen(null)}
      />
    );
  }

  if (loading) return <LoadingSpinner message="Loading auditorium screens..." />;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <Link to="/admin" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 mb-1">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Monitor className="text-rose-500" size={32} />
            Auditoriums & Custom Seating
          </h1>
          <p className="text-xs text-slate-400">
            Manage screens for {user?.theatre?.name || 'your assigned theatre'} and configure custom row seat layouts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-2xl text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Screen
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screens.map((scr) => (
          <div
            key={scr.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-amber-400 font-extrabold text-xs rounded-xl">
                  Screen #{scr.screenNumber} • {scr.screenType}
                </span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Armchair size={14} className="text-rose-500" />
                  {scr.totalSeats} Seats
                </span>
              </div>

              <h3 className="text-xl font-black text-white">{scr.name}</h3>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>Status: <span className="font-bold text-emerald-400">ACTIVE</span></p>
                <p>Configured Rows: <span className="font-bold text-slate-200">{new Set(scr.seats?.map(s => s.row)).size || 0} Rows</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setEditingScreen(scr)}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 hover:brightness-110 transition flex items-center justify-center gap-1.5"
              >
                <Armchair size={14} />
                Configure Seating Layout
              </button>
              <button
                onClick={() => handleDeleteScreen(scr.id)}
                className="p-2.5 bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl transition"
                title="Delete Screen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Screen Modal */}
      {showAddModal && (
        <Modal title="Add New Auditorium Screen" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleCreateScreen} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Screen Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Screen 1 or IMAX Auditorium"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Screen Number</label>
              <input
                type="number"
                required
                min="1"
                value={screenNumber}
                onChange={(e) => setScreenNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Screen Type</label>
              <select
                value={screenType}
                onChange={(e) => setScreenType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="STANDARD">STANDARD (2D/3D)</option>
                <option value="IMAX">IMAX 3D Laser</option>
                <option value="FOUR_DX">4DX Motion & Effects</option>
                <option value="PREMIUM">PREMIUM Luxury Recliner</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                {submitting ? 'Creating Screen...' : 'Create Screen'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ManageScreens;
