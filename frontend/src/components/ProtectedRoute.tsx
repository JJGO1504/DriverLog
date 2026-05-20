import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
