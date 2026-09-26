import React, { useState, useEffect } from 'react';
import { requestGraphQL } from '../../utils/graphqlClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import { Crown, Building2, Users, Monitor, Film, Ticket, DollarSign, Plus, Edit, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const GET_SUPER_ADMIN_DATA = `
  query GetSuperAdminData {
    platformStats {
      totalTheatres
      totalScreens
      totalAdmins
      totalUsers
      totalMovies
      totalShows
      totalBookings
      totalRevenue
    }
    theatres {
      id
      name
      description
      address
      city
      state
      pincode
      phone
      email
      image
      isActive
      screens {
        id
        name
      }
      admins {
        id
        name
        email
      }
    }
    admins {
      id
      name
      email
      phone
      role
      theatreId
      theatre {
        id
        name
      }
    }
  }
`;

const CREATE_THEATRE_MUTATION = `
  mutation CreateTheatre($input: TheatreInput!) {
    createTheatre(input: $input) {
      id
      name
      city
    }
  }
`;

const UPDATE_THEATRE_MUTATION = `
  mutation UpdateTheatre($id: ID!, $input: TheatreInput!) {
    updateTheatre(id: $id, input: $input) {
      id
      name
    }
  }
`;

const DEACTIVATE_THEATRE_MUTATION = `
  mutation DeactivateTheatre($id: ID!) {
    deactivateTheatre(id: $id) {
      id
      isActive
    }
  }
`;

const CREATE_ADMIN_MUTATION = `
  mutation CreateAdmin($name: String!, $email: String!, $password: String!, $phone: String!, $age: Int!, $theatreId: ID!) {
    createAdmin(name: $name, email: $email, password: $password, phone: $phone, age: $age, theatreId: $theatreId) {
      id
      name
      email
    }
  }
`;

const ASSIGN_ADMIN_MUTATION = `
  mutation AssignAdminToTheatre($userId: ID!, $theatreId: ID!) {
    assignAdminToTheatre(userId: $userId, theatreId: $theatreId) {
      id
      name
    }
  }
`;

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [theatres, setTheatres] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('theatres');
  const [showTheatreModal, setShowTheatreModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);

  // Theatre Form
  const [thName, setThName] = useState('');
  const [thDesc, setThDesc] = useState('');
  const [thAddress, setThAddress] = useState('');
  const [thCity, setThCity] = useState('Chandigarh');
  const [thState, setThState] = useState('Punjab');
  const [thPincode, setThPincode] = useState('160002');
  const [thPhone, setThPhone] = useState('');
  const [thEmail, setThEmail] = useState('');
  const [thImage, setThImage] = useState('');

  // Admin Form
  const [admName, setAdmName] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admPassword, setAdmPassword] = useState('admin123');
  const [admPhone, setAdmPhone] = useState('');
  const [admAge, setAdmAge] = useState(30);
  const [selectedTheatreId, setSelectedTheatreId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await requestGraphQL(GET_SUPER_ADMIN_DATA);
      setStats(data.platformStats);
      setTheatres(data.theatres || []);
      setAdmins(data.admins || []);
      if (data.theatres && data.theatres.length > 0) {
        setSelectedTheatreId(data.theatres[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenTheatreModal = (theatre = null) => {
    if (theatre) {
      setEditingTheatre(theatre);
      setThName(theatre.name);
      setThDesc(theatre.description);
      setThAddress(theatre.address);
      setThCity(theatre.city);
      setThState(theatre.state);
      setThPincode(theatre.pincode);
      setThPhone(theatre.phone);
      setThEmail(theatre.email);
      setThImage(theatre.image);
    } else {
      setEditingTheatre(null);
      setThName('');
      setThDesc('');
      setThAddress('');
      setThCity('Chandigarh');
      setThState('Punjab');
      setThPincode('160002');
      setThPhone('');
      setThEmail('');
      setThImage('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80');
    }
    setShowTheatreModal(true);
  };

  const handleSaveTheatre = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: thName,
        description: thDesc,
        address: thAddress,
        city: thCity,
        state: thState,
        pincode: thPincode,
        phone: thPhone,
        email: thEmail,
        image: thImage,
      };

      if (editingTheatre) {
        await requestGraphQL(UPDATE_THEATRE_MUTATION, { id: editingTheatre.id, input: payload });
        toast.success(`Theatre "${thName}" updated!`);
      } else {
        await requestGraphQL(CREATE_THEATRE_MUTATION, { input: payload });
        toast.success(`New Theatre "${thName}" created!`);
      }

      setShowTheatreModal(false);
      fetchData();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateTheatre = async (id) => {
    try {
      await requestGraphQL(DEACTIVATE_THEATRE_MUTATION, { id });
      toast.info('Theatre status updated.');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const targetTheatreId = selectedTheatreId || (theatres[0]?.id);
    if (!targetTheatreId) {
      toast.error('Please create or select a theatre first.');
      setSubmitting(false);
      return;
    }
    try {
      await requestGraphQL(CREATE_ADMIN_MUTATION, {
        name: admName,
        email: admEmail,
        password: admPassword,
        phone: admPhone,
        age: parseInt(admAge, 10),
        theatreId: targetTheatreId,
      });

      toast.success(`Admin "${admName}" created and assigned!`);
      setShowAdminModal(false);
      setAdmName('');
      setAdmEmail('');
      fetchData();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassignAdmin = async (adminId, theatreId) => {
    try {
      await requestGraphQL(ASSIGN_ADMIN_MUTATION, { userId: adminId, theatreId });
      toast.success('Admin theatre assignment updated!');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Platform Statistics & Super Admin Data..." />;

  return (
    <div className="space-y-10 pb-16">
      {/* Super Admin Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-rose-950 border border-purple-800/60 p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black uppercase tracking-wider rounded-full inline-flex items-center gap-1.5">
              <Crown size={14} className="text-amber-400" />
              Platform-Wide Super Administrator Control
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Super Admin Management Center</h1>
            <p className="text-xs text-slate-300">
              Create and manage all cinema theatres, assign theatre managers, and view real-time platform metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenTheatreModal(null)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5"
            >
              <Plus size={16} />
              Add Theatre
            </button>
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
            >
              <Plus size={16} />
              Add Admin
            </button>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Platform Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
            <div className="flex items-center justify-between text-purple-400">
              <Building2 size={20} />
              <span className="text-[10px] font-bold uppercase">Theatres</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalTheatres}</p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
            <div className="flex items-center justify-between text-rose-400">
              <Monitor size={20} />
              <span className="text-[10px] font-bold uppercase">Screens</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalScreens}</p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <ShieldAlert size={20} />
              <span className="text-[10px] font-bold uppercase">Admins</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.totalAdmins}</p>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <DollarSign size={20} />
              <span className="text-[10px] font-bold uppercase">Total Revenue</span>
            </div>
            <p className="text-2xl font-black text-emerald-400">₹{stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('theatres')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'theatres'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 size={16} />
          Theatres Management ({theatres.length})
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'admins'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users size={16} />
          Admins & Assignments ({admins.length})
        </button>
      </div>

      {/* Theatres Tab */}
      {activeTab === 'theatres' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {theatres.map((th) => (
            <div
              key={th.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6 space-y-4 hover:border-purple-500/50 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-rose-400 font-extrabold text-xs rounded-xl">
                    {th.city}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${th.isActive ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' : 'bg-rose-950 text-rose-300 border-rose-500/30'}`}>
                    {th.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white">{th.name}</h3>
                <p className="text-xs text-slate-400">{th.address}</p>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p>Screens: <span className="font-bold text-white">{th.screens?.length || 0} Auditoriums</span></p>
                  <p>Assigned Manager: <span className="font-bold text-amber-400">{th.admins?.[0]?.name || 'Unassigned'}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenTheatreModal(th)}
                  className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs border border-slate-800 transition flex items-center justify-center gap-1.5"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeactivateTheatre(th.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${th.isActive ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-800' : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'}`}
                >
                  {th.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-extrabold text-slate-400">
                <th className="pb-3">Admin Name</th>
                <th className="pb-3">Email & Phone</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Assigned Theatre</th>
                <th className="pb-3">Change Theatre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-950/50 transition">
                  <td className="py-4 font-bold text-white">{adm.name}</td>
                  <td className="py-4 text-slate-300">
                    <div>{adm.email}</div>
                    <div className="text-slate-500">{adm.phone}</div>
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${adm.role === 'SUPER_ADMIN' ? 'bg-purple-600 text-white' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                      {adm.role}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-slate-200">
                    {adm.theatre ? adm.theatre.name : 'Platform Wide'}
                  </td>
                  <td className="py-4">
                    {adm.role !== 'SUPER_ADMIN' && (
                      <select
                        value={adm.theatreId || ''}
                        onChange={(e) => handleReassignAdmin(adm.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                      >
                        {theatres.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.city})
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Theatre Modal */}
      {showTheatreModal && (
        <Modal title={editingTheatre ? `Edit Theatre: ${editingTheatre.name}` : 'Create New Cinema Theatre'} onClose={() => setShowTheatreModal(false)}>
          <form onSubmit={handleSaveTheatre} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Theatre Name</label>
                <input
                  type="text"
                  required
                  value={thName}
                  onChange={(e) => setThName(e.target.value)}
                  placeholder="e.g. PVR Elante"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">City</label>
                <input
                  type="text"
                  required
                  value={thCity}
                  onChange={(e) => setThCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description</label>
              <textarea
                required
                rows={2}
                value={thDesc}
                onChange={(e) => setThDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={thAddress}
                  onChange={(e) => setThAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  value={thPincode}
                  onChange={(e) => setThPincode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={thPhone}
                  onChange={(e) => setThPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={thEmail}
                  onChange={(e) => setThEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Image URL</label>
              <input
                type="text"
                required
                value={thImage}
                onChange={(e) => setThImage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTheatreModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                {submitting ? 'Saving...' : 'Save Theatre'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Admin Modal */}
      {showAdminModal && (
        <Modal title="Create Theatre Admin & Assign Theatre" onClose={() => setShowAdminModal(false)}>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Admin Full Name</label>
              <input
                type="text"
                required
                value={admName}
                onChange={(e) => setAdmName(e.target.value)}
                placeholder="e.g. Cinema Manager"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={admEmail}
                onChange={(e) => setAdmEmail(e.target.value)}
                placeholder="admin@cinebook.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={admPassword}
                  onChange={(e) => setAdmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={admPhone}
                  onChange={(e) => setAdmPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Assign to Theatre</label>
              <select
                value={selectedTheatreId}
                onChange={(e) => setSelectedTheatreId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              >
                {theatres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                {submitting ? 'Creating...' : 'Create & Assign Admin'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
