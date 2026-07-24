import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on app start
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (!decoded) throw new Error('Failed to decode token');

        // ⏳ Check token expiration
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser({
            username: decoded.sub || decoded.username || decoded.email || '',
            role: decoded.role || decoded.roles || 'ROLE_USER',
          });
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
        setUser(null);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (token) => {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Missing or invalid JWT token');
      }

      const decoded = jwtDecode(token);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        throw new Error('JWT token has expired');
      }

      localStorage.setItem('token', token);

      setUser({
        username:
          decoded.sub ||
          decoded.username ||
          decoded.email ||
          '',
        role:
          decoded.role ||
          decoded.roles ||
          'ROLE_USER',
      });

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      return false;
    }
  };
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};