import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center gap-5 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-rose-600/30">
            {user.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.name}</h1>
            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 font-bold text-xs rounded-lg uppercase tracking-wider">
              {user.role} Account
            </span>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Mail size={18} className="text-rose-500 shrink-0" />
            <div>
              <span className="text-xs text-slate-500 block">Email Address</span>
              <span className="font-semibold text-slate-200">{user.email}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Phone size={18} className="text-amber-500 shrink-0" />
            <div>
              <span className="text-xs text-slate-500 block">Phone Number</span>
              <span className="font-semibold text-slate-200">{user.phone}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
            <Calendar size={18} className="text-emerald-500 shrink-0" />
            <div>
              <span className="text-xs text-slate-500 block">Registered Age</span>
              <span className="font-semibold text-slate-200">{user.age} Years Old</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
