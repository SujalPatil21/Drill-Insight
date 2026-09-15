import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo } from '../components/ui/BrandLogo';
import HompageImg from '../assets/Homepageimage.jpg';

type Mode = 'login' | 'register';

export function Login() {
  const navigate = useNavigate();
  const { login, register, authenticated, loading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && authenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authenticated, loading, navigate]);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        navigate('/dashboard', { replace: true });
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        const msg = await register(username.trim(), email.trim(), password, confirmPassword);
        setSuccessMsg(msg);
        // auto-switch to login
        setTimeout(() => {
          setMode('login');
          setSuccessMsg('');
          setPassword('');
          setConfirmPassword('');
          setUsername('');
        }, 1800);
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to connect to NWIS authentication service.';
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setError('Unable to connect to NWIS authentication service.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #087F73', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', background: '#0A0A0A', overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ── LEFT PANEL: Branding ─────────────────────────────── */}
      <div style={{
        flex: '1 1 55%', position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: '48px', overflow: 'hidden',
      }}>
        {/* Background image with dark overlay */}
        <img
          src={HompageImg}
          alt="NWIS Field Operations"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            filter: 'brightness(0.35) saturate(0.7)',
          }}
        />
        {/* Teal gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(8,127,115,0.18) 0%, rgba(10,10,10,0.6) 60%, rgba(10,10,10,0.9) 100%)',
        }} />

        {/* NWIS wordmark top-left */}
        <div style={{ position: 'absolute', top: 36, left: 48, zIndex: 2 }}>
          <BrandLogo />
        </div>

        {/* Bottom branding text */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ color: '#087F73', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
            — Geospatial Drilling Intelligence
          </div>
          <h1 style={{ color: '#F5F5F2', fontSize: 36, fontWeight: 800, lineHeight: 1.15, margin: 0, marginBottom: 16, letterSpacing: '-0.01em' }}>
            Precision Well<br />Site Intelligence
          </h1>
          <p style={{ color: '#A3A3A3', fontSize: 13, lineHeight: 1.7, maxWidth: 380, margin: 0 }}>
            PostGIS-backed spatial analysis. Deterministic candidate scoring.
            Real-time field intelligence for upstream drilling engineers.
          </p>
          {/* Capability badges */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
            {['PostGIS Spatial', 'Field Polygons', 'Risk Analytics', 'Candidate Engine'].map(badge => (
              <span key={badge} style={{
                padding: '4px 10px', border: '1px solid rgba(8,127,115,0.35)',
                borderRadius: 4, color: '#087F73', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(8,127,115,0.08)',
              }}>{badge}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Form ────────────────────────────── */}
      <div style={{
        flex: '0 0 420px', minWidth: 360, maxWidth: 460,
        background: '#111111', borderLeft: '1px solid #1E1E1E',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        animation: 'fadeSlideUp 0.3s ease both',
      }}>
        {/* Title */}
        <div style={{ width: '100%', marginBottom: 36 }}>
          <div style={{ color: '#087F73', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
            Engineer Portal
          </div>
          <h2 style={{ color: '#F5F5F2', fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
            {mode === 'login' ? 'Access NWIS' : 'Create Account'}
          </h2>
          <p style={{ color: '#737373', fontSize: 13, margin: '6px 0 0' }}>
            {mode === 'login' ? 'Sign in to your engineer account' : 'Register as a new NWIS engineer'}
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', width: '100%', gap: 0, marginBottom: 28, border: '1px solid #2A2A2A', borderRadius: 6, overflow: 'hidden' }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              border: 'none', transition: 'all 0.18s ease',
              background: mode === m ? '#087F73' : 'transparent',
              color: mode === m ? '#F5F5F2' : '#737373',
            }}>
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {/* Success message */}
        {successMsg && (
          <div style={{
            width: '100%', marginBottom: 20, padding: '10px 14px',
            background: 'rgba(62,143,104,0.12)', border: '1px solid rgba(62,143,104,0.3)',
            borderRadius: 6, color: '#3E8F68', fontSize: 13,
          }}>
            {successMsg}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            width: '100%', marginBottom: 20, padding: '10px 14px',
            background: 'rgba(217,74,74,0.1)', border: '1px solid rgba(217,74,74,0.25)',
            borderRadius: 6, color: '#D94A4A', fontSize: 13,
          }}>
            {error}
            {error.includes('connect') && (
              <button onClick={() => setError('')} style={{
                marginLeft: 12, color: '#087F73', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 12, textDecoration: 'underline',
              }}>Retry</button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', color: '#A3A3A3', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="engineer_username"
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: '#A3A3A3', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="engineer@ongc.co.in"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#A3A3A3', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', color: '#A3A3A3', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 8, padding: '12px 0', width: '100%',
              background: submitting ? '#065C57' : '#087F73',
              color: '#F5F5F2', border: 'none', borderRadius: 6,
              fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#0A9C8E'; }}
            onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#087F73'; }}
          >
            {submitting && (
              <div style={{ width: 14, height: 14, border: '2px solid rgba(245,245,242,0.3)', borderTopColor: '#F5F5F2', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            )}
            {submitting
              ? (mode === 'login' ? 'Authenticating...' : 'Creating Account...')
              : (mode === 'login' ? 'Login' : 'Register')}
          </button>
        </form>

        <div style={{ marginTop: 24, color: '#737373', fontSize: 12 }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => switchMode('register')} style={{ color: '#087F73', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                Register
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => switchMode('login')} style={{ color: '#087F73', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                Login
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: 48, color: '#404040', fontSize: 10, textAlign: 'center', letterSpacing: '0.08em' }}>
          NWIS v1.0 · Decision Support Only · Not for navigation
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 720px) {
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#171717', border: '1px solid #2A2A2A',
  borderRadius: 6, padding: '10px 14px',
  color: '#F5F5F2', fontSize: 14, outline: 'none',
  transition: 'border-color 0.15s ease',
  fontFamily: "'Inter', sans-serif",
};
