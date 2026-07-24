import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });

    console.log('Login response:', response.data);

    const token =
      response.data.accessToken ||
      response.data.token ||
      response.data.jwtToken;

    if (!token) {
      throw new Error('No JWT token returned by backend');
    }

    const success = login(token);

    if (!success) {
      throw new Error('Could not process login token');
    }

    navigate(from, { replace: true });
  } catch (err) {
    console.error('Login error:', err);
    console.error('Backend response:', err.response?.data);
    setError('Invalid email or password');
  }
};

  return (
    <div className="container animate-fade-in mb-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 className="text-center mb-2"><LogIn className="icon-inline" /> Login</h2>
        {error && <div style={{ color: '#ff4d4f', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Login</button>
        </form>
        <p className="text-center mt-1 text-muted" style={{ fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
