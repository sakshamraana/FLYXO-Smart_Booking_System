import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import Theatres from './pages/Theatres';
import TheatreDetails from './pages/TheatreDetails';
import BookingPage from './pages/BookingPage';
import BookingConfirmation from './pages/BookingConfirmation';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';

import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import ManageScreens from './pages/admin/ManageScreens';
import ManageMovies from './pages/admin/ManageMovies';
import ManageShows from './pages/admin/ManageShows';
import ManageUsers from './pages/admin/ManageUsers';
import ManageBookings from './pages/admin/ManageBookings';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-rose-500 selection:text-white">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<Home />} />
                <Route path="/theatres" element={<Theatres />} />
                <Route path="/theatre/:id" element={<TheatreDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/movie/:id" element={<MovieDetails />} />

                {/* Authenticated User Routes */}
                <Route
                  path="/booking/:showId"
                  element={
                    <ProtectedRoute>
                      <BookingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking-confirmation/:bookingId"
                  element={
                    <ProtectedRoute>
                      <BookingConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-cancelled"
                  element={
                    <ProtectedRoute>
                      <PaymentCancelled />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Theatre Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/screens"
                  element={
                    <AdminRoute>
                      <ManageScreens />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/movies"
                  element={
                    <AdminRoute>
                      <ManageMovies />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/shows"
                  element={
                    <AdminRoute>
                      <ManageShows />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <ManageUsers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/bookings"
                  element={
                    <AdminRoute>
                      <ManageBookings />
                    </AdminRoute>
                  }
                />

                {/* Super Admin Routes */}
                <Route
                  path="/super-admin"
                  element={
                    <SuperAdminRoute>
                      <SuperAdminDashboard />
                    </SuperAdminRoute>
                  }
                />
              </Routes>
            </main>
            <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>© 2026 CINEBOOK Multi-Theatre Real-Time Cinema Platform. All rights reserved.</p>
              </div>
            </footer>
            <ToastContainer position="bottom-right" theme="dark" autoClose={4000} />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
