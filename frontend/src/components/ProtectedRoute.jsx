import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner message="Checking authentication..." />;

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) return <LoadingSpinner message="Verifying admin permissions..." />;

  if (!token || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const SuperAdminRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) return <LoadingSpinner message="Verifying super admin permissions..." />;

  if (!token || user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};
