import React, { useEffect, useState } from 'react';
import { requestGraphQL } from '../../utils/graphqlClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { toast } from 'react-toastify';
import { Users, Power, Trash2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

const USERS_QUERY = `
  query GetUsers {
    users {
      id
      name
      email
      phone
      age
      role
      isActive
      createdAt
    }
  }
`;

const UPDATE_USER_STATUS_MUTATION = `
  mutation UpdateUserStatus($id: ID!, $isActive: Boolean!) {
    updateUserStatus(id: $id, isActive: $isActive) {
      id
      isActive
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestGraphQL(USERS_QUERY);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    try {
      await requestGraphQL(UPDATE_USER_STATUS_MUTATION, {
        id: user.id,
        isActive: !user.isActive,
      });
      toast.info(`User ${user.name} status updated.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    try {
      await requestGraphQL(DELETE_USER_MUTATION, { id: deletingUserId });
      toast.success('User account deleted.');
      setDeletingUserId(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Registered Users..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchUsers} />;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Users className="text-rose-500" size={32} />
            Manage Users
          </h1>
          <p className="text-slate-400 text-sm">View, activate, deactivate, or remove registered user accounts.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Age</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850 transition">
                  <td className="p-3">
                    <span className="font-bold text-white text-sm block">{u.name}</span>
                    <span className="text-[10px] text-slate-500">{u.email}</span>
                  </td>
                  <td className="p-3 font-mono">{u.phone}</td>
                  <td className="p-3 font-semibold">{u.age} yrs</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-2.5 py-1 rounded font-bold text-[10px] uppercase flex items-center gap-1 transition ${
                        u.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Power size={10} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => setDeletingUserId(u.id)}
                        className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg transition"
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={!!deletingUserId}
        onClose={() => setDeletingUserId(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message="Are you sure you want to permanently delete this user account?"
        confirmText="Delete Account"
        isDangerous={true}
      />
    </div>
  );
};

export default ManageUsers;
