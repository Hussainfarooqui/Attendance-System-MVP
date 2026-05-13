import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const logoUrl = "https://iqra.edu.pk/wp-content/uploads/2025/08/LOGO-IU-01-2048x495-1.png";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed. Please check your email and password.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #12284B 0%, #0A1A33 100%)',
      padding: '20px'
    }}>
      <div className="glass-card" style={{ 
        padding: '36px', 
        width: '95%',
        maxWidth: '420px', 
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <img src={logoUrl} alt="Iqra University" style={{ width: '220px', marginBottom: '32px' }} />
        
        <h2 style={{ marginBottom: '8px', color: '#12284B', fontSize: '24px' }}>AI Attendance System</h2>
        <p style={{ color: '#64748B', marginBottom: '32px', fontSize: '15px' }}>University Management Portal</p>
        
        {error && (
          <div style={{ 
            background: '#FEE2E2', 
            color: '#991B1B', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#475569' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="name@iqra.edu.pk" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#475569' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '16px' }} 
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            &copy; {new Date().getFullYear()} IQRA University. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
