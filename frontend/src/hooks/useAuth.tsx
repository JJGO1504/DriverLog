import { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextValue {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsUser: () => void;
  loginAsSuperuser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('driverlog_user');
    return saved ? JSON.parse(saved) : null;
  });

  const saveUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) localStorage.setItem('driverlog_user', JSON.stringify(user));
    else localStorage.removeItem('driverlog_user');
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.loginUser(email, password);
    saveUser(data.user);
  }, []);

  const loginAsUser = useCallback(() => {
    saveUser({ id: 1, nombre: 'Conductor de prueba', email: 'conductor@driverlog.local', role: 'USER' });
  }, []);

  const loginAsSuperuser = useCallback(() => {
    saveUser({ id: 999, nombre: 'Administrador DriverLog', email: 'admin@driverlog.local', role: 'SUPERUSER' });
  }, []);

  const logout = useCallback(() => saveUser(null), []);

  return (
    <AuthContext.Provider value={{ currentUser, login, loginAsUser, loginAsSuperuser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
