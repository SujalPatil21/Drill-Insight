import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:8000/api';

export interface Engineer {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: Engineer | null;
  loading: boolean;
  authenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const user: Engineer = await res.json();
        console.log(`[AUTH] session restored user=${user.username}`);
        setState({ user, loading: false, authenticated: true });
      } else {
        setState({ user: null, loading: false, authenticated: false });
      }
    } catch {
      setState({ user: null, loading: false, authenticated: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    console.log('[AUTH] login request');
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      console.warn(`[AUTH] login failed status=${res.status}`);
      throw new Error(err.detail || 'Invalid email or password');
    }
    const data = await res.json();
    console.log(`[AUTH] login success user=${data.user?.username}`);
    setState({ user: data.user, loading: false, authenticated: true });
  };

  const register = async (username: string, email: string, password: string, confirmPassword: string): Promise<string> => {
    console.log('[AUTH] registration request');
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, confirm_password: confirmPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    console.log('[AUTH] registration success');
    const data = await res.json();
    return data.message || 'Registration successful. Please log in.';
  };

  const logout = async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    setState({ user: null, loading: false, authenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
