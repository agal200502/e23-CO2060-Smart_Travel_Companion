import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Accommodation from './pages/Accommodation';
import MapPage from './pages/MapPage';
import TripPlanner from './pages/TripPlanner';
import AutoGenerator from './pages/AutoGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  if (loading) return <div>Loading...</div>;
  return user && user.role === 'ROLE_ADMIN'
    ? children
    : <Navigate to="/login" state={{ from: location }} replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={
            <PrivateRoute>
              <Explore />
            </PrivateRoute>
          } />
          <Route path="/planner" element={
            <PrivateRoute>
              <TripPlanner />
            </PrivateRoute>
          } />
          <Route path="/auto-generator" element={
            <PrivateRoute>
              <AutoGenerator />
            </PrivateRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/accommodation/:locationId" element={
            <PrivateRoute>
              <Accommodation />
            </PrivateRoute>
          } />
          <Route path="/booking/:accommodationId" element={
            <PrivateRoute>
              <Booking />
            </PrivateRoute>
          } />
          <Route path="/my-bookings" element={
            <PrivateRoute>
              <MyBookings />
            </PrivateRoute>
          } />
          <Route path="/map" element={
            <PrivateRoute>
              <MapPage />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
