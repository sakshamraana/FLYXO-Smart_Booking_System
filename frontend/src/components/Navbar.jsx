import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, Ticket, ShieldAlert, Menu, X, Sparkles, Building2, Crown } from 'lucide-react';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully.');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/movies';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform duration-200">
            <Film size={24} />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-rose-400 transition">
              CINE<span className="text-rose-500">BOOK</span>
            </span>
            <span className="block text-[9px] tracking-[0.2em] text-slate-400 font-extrabold uppercase flex items-center gap-1">
              <Sparkles size={10} className="text-amber-400" />
              Multi-Theatre System
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          <Link
            to="/movies"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isActive('/') || isActive('/movies')
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Film size={15} />
            Movies
          </Link>

          <Link
            to="/theatres"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isActive('/theatres')
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 size={15} />
            Theatres
          </Link>

          {user && (
            <Link
              to="/my-bookings"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive('/my-bookings')
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Ticket size={15} />
              My Bookings
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              to="/super-admin"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname.startsWith('/super-admin')
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              <Crown size={15} />
              Super Admin
            </Link>
          )}

          {isAdmin && !isSuperAdmin && (
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <ShieldAlert size={15} />
              Theatre Admin
            </Link>
          )}
        </nav>

        {/* User Account Controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 px-3.5 py-1.5 rounded-2xl transition"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 font-bold text-xs">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-200 leading-none">{user.name}</p>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">
                    {user.role} {user.theatre ? `(${user.theatre.name})` : ''}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-2xl bg-slate-900/90 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/60 transition"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-lg shadow-rose-600/25 transition transform hover:scale-105"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <Link
            to="/movies"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            Explore Movies
          </Link>
          <Link
            to="/theatres"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            Explore Theatres
          </Link>
          {user && (
            <Link
              to="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
            >
              My Bookings
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              to="/super-admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-bold text-purple-400 hover:bg-purple-500/10"
            >
              Super Admin Portal
            </Link>
          )}
          {isAdmin && !isSuperAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-bold text-amber-400 hover:bg-amber-500/10"
            >
              Theatre Admin Portal
            </Link>
          )}
          {user ? (
            <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-bold text-slate-300"
              >
                <User size={16} />
                Profile ({user.name})
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-400 flex items-center gap-1"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-900 flex items-center gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-slate-900 rounded-xl text-xs font-bold text-slate-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-rose-600 rounded-xl text-xs font-bold text-white"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
