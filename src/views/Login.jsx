import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ShieldAlert, Settings, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, serverUrl, updateServerUrl } = useAuth();
  const [pin, setPin] = useState('');
  const [selectedRole, setSelectedRole] = useState(''); // Optional explicit role
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(serverUrl);
  const [showPassword, setShowPassword] = useState(false);

  // Available staff roles for explicit login selection (optional convenience)
  const roles = [
    { value: '', label: 'Auto-Detect Role from PIN' },
    { value: 'owner', label: 'Owner / Manager' },
    { value: 'highway_staff', label: 'Highway Branch Staff' },
    { value: 'mainroad_staff', label: 'Mainroad Branch Staff' },
    { value: 'production', label: 'Production / Baker' },
    { value: 'ordering', label: 'Ordering & Billing' },
    { value: 'driver', label: 'Driver / Deliveries' }
  ];

  // Perform PIN submission
  const handleSubmit = async (enteredPin) => {
    setIsSubmitting(true);
    setError('');
    try {
      await login(enteredPin, selectedRole || null);
    } catch (err) {
      setError(err.message || 'Incorrect PIN. Please try again.');
      setPin('');
      setIsShaking(true);
      // Play a tactile phone-vibration effect if browser supports it
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="login-container">
      {/* Decorative floating flour/baking bubbles in the background */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div className={`login-glass-card ${isShaking ? 'shake' : ''}`}>
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="/logo_full.png" 
            alt="Akshay Bakery" 
            className="brand-logo-full" 
            style={{ 
              width: '190px', 
              height: 'auto', 
              marginBottom: '0.5rem'
            }} 
          />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', letterSpacing: '0.15em', fontWeight: '700' }}>
            STAFF PORTAL
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#fca5a5',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group" style={{ maxWidth: '280px', marginLeft: 'auto', margin_right: 'auto', marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ textAlign: 'left' }}>Select Role</label>
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="form-input"
            style={{ textAlign: 'center', padding: '0.75rem' }}
          >
            {roles.map(r => (
              <option key={r.value} value={r.value} style={{ background: '#0c3a2d', color: '#fff' }}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(pin.trim()); }} style={{ maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto', width: '100%' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative', textAlign: 'left' }}>
            <label className="form-label">Security PIN / Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={pin}
                onChange={(e) => {
                  setError('');
                  setPin(e.target.value);
                }}
                placeholder="Enter PIN or Password"
                disabled={isSubmitting}
                style={{
                  paddingRight: '2.5rem',
                  letterSpacing: pin.length > 0 && !showPassword ? '0.25em' : 'normal',
                  fontSize: pin.length > 0 && !showPassword ? '1.2rem' : '1rem',
                  textAlign: 'left'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !pin}
            style={{
              width: '100%',
              padding: '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.9rem',
              boxShadow: '0 0 15px rgba(16,185,129,0.3)',
              transition: 'all 0.2s',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            <KeyRound size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            PINs are validated live by the operational server.
          </p>
          <button
            type="button"
            onClick={() => {
              setTempUrl(getBaseURL()); // Fetch latest stored url
              setShowServerConfig(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: 0.9,
              padding: '4px 8px',
              transition: 'opacity 0.2s'
            }}
          >
            <Settings size={12} />
            Configure Server Sync
          </button>
        </div>
      </div>

      {showServerConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="login-glass-card" style={{ maxWidth: '400px', width: '100%', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <Settings size={20} className="glow-emerald" style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#f3f4f6' }}>
                Server Sync URL
              </h2>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Enter the Express backend API server URL to dynamically sync operations, sales registers, and recipes live.
            </p>
            
            <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label className="form-label">Backend API Server URL</label>
              <input 
                type="text" 
                className="form-input" 
                value={tempUrl} 
                onChange={(e) => setTempUrl(e.target.value)} 
                placeholder="http://10.228.88.184:5000"
                style={{ textAlign: 'left', padding: '0.75rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                To connect your Android device to this local PC on the same Wi-Fi, enter:<br />
                <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', color: 'var(--color-primary)', display: 'inline-block', marginTop: '4px', fontSize: '0.8rem' }}>
                  http://10.228.88.184:5000
                </code>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                type="button" 
                onClick={() => setShowServerConfig(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  updateServerUrl(tempUrl);
                  setShowServerConfig(false);
                }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
              >
                Save Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
