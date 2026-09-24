import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Map, Compass, Home, LogOut, User, ShieldAlert, Menu, X, Sparkles } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Active link checker
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass">
      <div className="container navbar-container">
        
        <Link to="/" className="navbar-logo">
          <Compass className="logo-icon" size={28} />
          <span>SmartTravel Lanka</span>
        </Link>

        {/* Hamburger Button */}
        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </div>

        {/* Menu */}
        <ul className={`navbar-menu ${menuOpen ? 'active' : ''}`}>

          <li>
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active-link' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Home size={18} /> Home
            </Link>
          </li>

          {user ? (
            <>
              <li>
                <Link 
                  to="/explore" 
                  className={`nav-link ${isActive('/explore') ? 'active-link' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Map size={18} /> Explore
                </Link>
              </li>

              <li>
                <Link 
                  to="/planner" 
                  className={`nav-link ${isActive('/planner') ? 'active-link' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Compass size={18} /> Planner
                </Link>
              </li>

              <li>
                <Link 
                  to="/auto-generator" 
                  className={`nav-link ${isActive('/auto-generator') ? 'active-link' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Sparkles size={18} /> Auto Generator
                </Link>
              </li>

              {user.role === 'ROLE_ADMIN' && (
                <li>
                  <Link 
                    to="/admin/dashboard" 
                    className={`nav-link ${isActive('/admin/dashboard') ? 'active-link' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <ShieldAlert size={18} /> Admin
                  </Link>
                </li>
              )}

              <li>
                <span className="nav-user">
                  <User size={18} /> {user.username}
                </span>
              </li>

              <li>
                <Link 
                  to="/my-bookings" 
                  className={`nav-link ${isActive('/my-bookings') ? 'active-link' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  My Bookings
                </Link>
              </li>

              <li>
                <button onClick={handleLogout} className="btn-logout">
                  <LogOut size={18} /> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link 
                  to="/login" 
                  className={`nav-link ${isActive('/login') ? 'active-link' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
              </li>

              <li>
                <Link 
                  to="/register" 
                  className="btn btn-primary btn-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>

      </div>
    </nav>
  );
};

export default Navbar;