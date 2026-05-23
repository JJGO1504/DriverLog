import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextValue {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  authReady: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function cleanupOldKeys() {
  const oldKeys = ['user', 'profile', 'token', 'driverlog_token_old'];
  oldKeys.forEach(k => localStorage.removeItem(k));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    cleanupOldKeys();
    const saved = localStorage.getItem('driverlog_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { localStorage.removeItem('driverlog_user'); return null; }
    }
    return null;
  });
  const [authReady, setAuthReady] = useState(false);

  const saveUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) localStorage.setItem('driverlog_user', JSON.stringify(user));
    else localStorage.removeItem('driverlog_user');
  };

  const saveToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('driverlog_token', token);
      api.setAuthToken(token);
    } else {
      localStorage.removeItem('driverlog_token');
      api.setAuthToken();
    }
  };

  // On mount: restore token and fetch real profile
  useEffect(() => {
    const token = localStorage.getItem('driverlog_token');
    if (!token) {
      // No token → clear stale user data
      saveUser(null);
      setAuthReady(true);
      return;
    }
    api.setAuthToken(token);
    api.fetchCurrentUser()
      .then(realUser => saveUser(realUser))
      .catch(() => { saveUser(null); saveToken(null); })
      .finally(() => setAuthReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.loginUser(email, password);
    saveToken(data.token);
    saveUser(data.user);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!currentUser) return;
    try {
      const realUser = await api.fetchCurrentUser();
      saveUser(realUser);
    } catch {
      // silent fail
    }
  }, [currentUser]);

  const logout = useCallback(() => {
    saveUser(null);
    saveToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, refreshUser, logout, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
