import { createContext, ReactNode, useContext, useState } from 'react';
import { Role, User } from '../types';

const mockUsers: Record<Role, User> = {
  USER: {
    id: 1,
    nombre: 'Conductor de prueba',
    email: 'conductor@driverlog.local',
    role: 'USER',
  },
  SUPERUSER: {
    id: 999,
    nombre: 'Administrador DriverLog',
    email: 'admin@driverlog.local',
    role: 'SUPERUSER',
  },
};

interface AuthContextValue {
  currentUser: User | null;
  loginAsUser: () => void;
  loginAsSuperuser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loginAsUser = () => setCurrentUser(mockUsers.USER);
  const loginAsSuperuser = () => setCurrentUser(mockUsers.SUPERUSER);
  const logout = () => setCurrentUser(null);

  return (
    <AuthContext.Provider value={{ currentUser, loginAsUser, loginAsSuperuser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
