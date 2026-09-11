import { useQuery } from '@tanstack/react-query';

const API_BASE = 'http://localhost:8000/api';

const fetchWithLogs = async (endpoint: string, options: any = {}) => {
  const method = options.method || 'GET';
  console.log(`[API REQUEST] ${method} ${API_BASE}${endpoint}`);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      const text = await res.text();
      console.error(`[API ERROR] ${method} ${endpoint}\n  status=${res.status}\n  body=${text.slice(0,200)}`);
      throw new Error(`HTTP ${res.status}: ${text.slice(0,100)}`);
    }
    const data = await res.json();
    console.log(`[API RESPONSE] ${method} ${endpoint} -> ${res.status}`, data);
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      console.error(`[NETWORK ERROR] ${method} ${endpoint} - backend may be down`);
    } else {
      console.error(`[API ERROR] ${method} ${endpoint}`, error);
    }
    throw error;
  }
};

// Wells
export const useWells = () => useQuery({ queryKey: ['wells'], queryFn: () => fetchWithLogs('/wells/') });

export const useNearbyWells = (lat: number, lng: number, radiusKm = 5.0, enabled = true) =>
  useQuery({
    queryKey: ['wells', 'nearby', lat, lng, radiusKm],
    queryFn: () => fetchWithLogs(`/wells/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`),
    enabled,
  });

export const useWellIntelligence = (wellId: string, enabled = true) =>
  useQuery({
    queryKey: ['wells', wellId, 'intelligence'],
    queryFn: () => fetchWithLogs(`/wells/${wellId}/intelligence`),
    enabled: !!wellId && enabled,
  });

export const useWellObservations = (wellId: string, enabled = true) =>
  useQuery({
    queryKey: ['wells', wellId, 'observations'],
    queryFn: () => fetchWithLogs(`/wells/${wellId}/observations`),
    enabled: !!wellId && enabled,
  });

export const useWellRecommendation = (wellId: string, enabled = true) =>
  useQuery({
    queryKey: ['wells', wellId, 'recommendation'],
    queryFn: () => fetchWithLogs(`/wells/${wellId}/recommendation`),
    enabled: !!wellId && enabled,
  });

export const useWellEvents = (wellId: string, enabled = true) =>
  useQuery({
    queryKey: ['wells', wellId, 'events'],
    queryFn: () => fetchWithLogs(`/wells/${wellId}/events`),
    enabled: !!wellId && enabled,
  });

// Dashboard
export const useDashboardOverview = () =>
  useQuery({ queryKey: ['dashboard', 'overview'], queryFn: () => fetchWithLogs('/dashboard/overview') });

// Risk
export const useRiskOverview = () =>
  useQuery({ queryKey: ['risk', 'overview'], queryFn: () => fetchWithLogs('/risk/overview') });

// Historical
export const useHistoricalSearch = (query: string, enabled = true) =>
  useQuery({
    queryKey: ['historical', 'search', query],
    queryFn: () => fetchWithLogs(`/historical/search?q=${encodeURIComponent(query)}`),
    enabled,
  });

// Reports
export const useReports = (query = '') =>
  useQuery({ queryKey: ['reports', query], queryFn: () => fetchWithLogs(`/reports/?q=${encodeURIComponent(query)}`) });

// Candidates
export const evaluateCandidate = (lat: number, lng: number) =>
  fetchWithLogs('/candidates/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: `C-${Math.floor(Math.random() * 100000)}`, latitude: lat, longitude: lng }),
  });

export const getRecommendedCandidates = (fieldName?: string) =>
  fetchWithLogs(`/candidates/recommended${fieldName ? `?field_name=${encodeURIComponent(fieldName)}` : ''}`);

export const downloadWellReport = (wellId: string) =>
  window.open(`${API_BASE}/reports/${wellId}/pdf`, '_blank');
