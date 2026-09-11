import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Activity,
  Search,
  AlertTriangle,
  History,
  MapPin,
  BookOpen,
  Server,
  Layers,
  LogOut,
  User,
} from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: <Activity size={18} /> },
    { path: '/dashboard/regions', label: 'Active Regions', icon: <Activity size={18} /> },
    { path: '/dashboard/risk', label: 'Risk Intelligence', icon: <AlertTriangle size={18} /> },
    { path: '/dashboard/history', label: 'Historical Intelligence', icon: <History size={18} /> },
    { path: '/dashboard/candidates', label: 'Candidate Evaluation', icon: <MapPin size={18} /> },
    { path: '/dashboard/reports', label: 'Reports / Knowledge', icon: <BookOpen size={18} /> },
    { path: '/dashboard/models', label: 'Model Status', icon: <Server size={18} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 bg-surface border-r border-border h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center space-x-2">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 3 L25 14 L14 25 L3 14 Z" fill="#087F73" stroke="#13A89E" strokeWidth="1.2" />
          <circle cx="14" cy="14" r="3" fill="#0A0A0A" />
        </svg>
        <div>
          <h1 className="font-bold text-lg leading-tight">NWIS</h1>
          <div className="text-xs text-text-secondary">Intelligence System</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Engineer identity + logout */}
      {user && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-text-primary truncate">{user.username}</div>
              <div className="text-[10px] text-text-secondary uppercase tracking-widest">Engineer</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-xs text-text-secondary hover:text-danger transition-colors py-1 px-2 rounded hover:bg-danger/5"
          >
            <LogOut size={13} />
            Log Out
          </button>
        </div>
      )}
    </aside>
  );
};

// ── Topbar (search + live-intel badge + user) ─────────────────────────────────
const Topbar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.results || []);
        setShowDropdown(true);
      } catch {
        setError('Unable to search NWIS intelligence.');
        setResults([]);
        setShowDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'WELL': return <Activity size={14} className="text-primary" />;
      case 'REGION': return <MapPin size={14} className="text-success" />;
      case 'FORMATION': return <Layers size={14} className="text-warning" />;
      case 'EVENT': return <AlertTriangle size={14} className="text-danger" />;
      case 'REPORT': return <BookOpen size={14} className="text-text-secondary" />;
      default: return <Search size={14} className="text-text-muted" />;
    }
  };

  const handleResultClick = (r: any) => {
    setShowDropdown(false);
    setQuery('');
    switch (r.type.toUpperCase()) {
      case 'WELL': navigate(`/dashboard/wells/${r.id}`); break;
      case 'REGION': navigate(`/dashboard/regions/${encodeURIComponent(r.id)}`); break;
      case 'FORMATION': navigate('/dashboard/history'); break;
      case 'EVENT': navigate('/dashboard/history'); break;
      case 'REPORT': navigate('/dashboard/reports'); break;
    }
  };

  const groupedResults = results.reduce((acc: any, r: any) => {
    const type = r.type.toUpperCase();
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 z-50">
      <div className="flex-1 max-w-2xl relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim().length >= 2) setShowDropdown(true); }}
            onFocus={() => { if (query.trim().length >= 2) setShowDropdown(true); }}
            placeholder="Search wells, formations, events, reports..."
            className="w-full bg-background border border-border rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary text-text-primary placeholder-text-secondary shadow-inner"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {showDropdown && query.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-md shadow-lg overflow-hidden max-h-96 overflow-y-auto animate-in fade-in duration-200">
            {error ? (
              <div className="p-4 text-center text-sm text-text-secondary flex flex-col items-center">
                <AlertTriangle size={24} className="text-danger opacity-50 mb-2" />
                <span>{error}</span>
              </div>
            ) : results.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-sm text-text-secondary italic">No matching intelligence found.</div>
            ) : (
              <div className="py-2">
                {Object.keys(groupedResults).map(type => (
                  <div key={type} className="mb-2 last:mb-0">
                    <div className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-background/50">{type}S</div>
                    {groupedResults[type].map((r: any, idx: number) => (
                      <div key={idx} onClick={() => handleResultClick(r)} className="px-4 py-2 hover:bg-surface-hover cursor-pointer flex items-start gap-3 transition-colors">
                        <div className="mt-1">{getIcon(r.type)}</div>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{r.title}</div>
                          {r.subtitle && <div className="text-xs text-text-secondary">{r.subtitle}</div>}
                          {r.match && <div className="text-[10px] text-text-muted mt-0.5 truncate max-w-md">{r.match}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-success/10 px-2 py-1 rounded border border-success/20">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-success">Live Intel</span>
        </div>
        {user && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User size={12} className="text-primary" />
            </div>
            <span className="font-medium text-text-primary hidden sm:block">{user.username}</span>
          </div>
        )}
      </div>
    </header>
  );
};

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #087F73', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: '#737373', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading NWIS...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ── Page imports ──────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CandidateEval } from './pages/CandidateEval';
import { Overview } from './pages/Overview';
import { ActiveRegions } from './pages/ActiveRegions';
import { RegionIntelligence } from './pages/RegionIntelligence';
import { WellIntelligence } from './pages/WellIntelligence';
import { RiskIntelligence } from './pages/RiskIntelligence';
import { HistoricalIntelligence } from './pages/HistoricalIntelligence';
import { ModelStatus } from './pages/ModelStatus';
import { Reports } from './pages/Reports';

const queryClient = new QueryClient();

// ── Dashboard Layout ──────────────────────────────────────────────────────────
const DashboardLayout = () => (
  <div className="h-screen bg-background flex overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/regions" element={<ActiveRegions />} />
          <Route path="/regions/:regionId" element={<RegionIntelligence />} />
          <Route path="/wells/:wellId" element={<WellIntelligence />} />
          <Route path="/risk" element={<RiskIntelligence />} />
          <Route path="/history" element={<HistoricalIntelligence />} />
          <Route path="/candidates" element={<CandidateEval />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/models" element={<ModelStatus />} />
          <Route path="*" element={<div className="p-6 text-text-secondary">Page not found.</div>} />
        </Routes>
      </main>
    </div>
  </div>
);

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
