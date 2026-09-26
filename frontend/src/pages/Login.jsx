import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestGraphQL } from '../utils/graphqlClient';
import { toast } from 'react-toastify';
import { Film, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        name
        email
        phone
        age
        role
        isActive
      }
    }
  }
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await requestGraphQL(LOGIN_MUTATION, {
        input: { email, password },
      });

      login(data.login.token, data.login.user);
      toast.success(`Welcome back, ${data.login.user.name}!`);

      if (data.login.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
            <Film size={32} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Sign In to Cinebook</h2>
          <p className="text-xs text-slate-400">Enter your account credentials to access tickets and bookings.</p>
        </div>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@cinebook.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs space-y-1.5 text-slate-400">
          <p className="font-bold text-rose-400 uppercase tracking-wider">Demo Credentials:</p>
          <div className="flex justify-between">
            <span>Admin Login:</span>
            <span className="text-slate-200 font-mono">admin@cinebook.com / admin123</span>
          </div>
          <div className="flex justify-between">
            <span>User Login:</span>
            <span className="text-slate-200 font-mono">user@cinebook.com / user123</span>
          </div>
        </div> */}

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-rose-400 hover:text-rose-300 transition">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
