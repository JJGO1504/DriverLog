import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from './authMiddleware';

export type Role = 'USER' | 'SUPERUSER';

const JWT_SECRET = process.env.JWT_SECRET || 'driverlog-secret-key-change-in-production';

export function getRequestRole(req: AuthRequest): Role {
  // Check JWT first (new auth)
  if (req.userId && req.userRole) {
    return req.userRole === 'SUPERUSER' ? 'SUPERUSER' : 'USER';
  }
  // Fallback to header (legacy auth)
  const rawRole = String(req.headers['x-user-role'] || 'USER').toUpperCase();
  return rawRole === 'SUPERUSER' ? 'SUPERUSER' : 'USER';
}

export function requireRole(requiredRole: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Try JWT auth first
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      try {
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
        req.userId = decoded.id;
        req.userRole = decoded.role;
      } catch { /* ignore, fall through to header check */ }
    }

    const currentRole = getRequestRole(req);
    if (currentRole !== requiredRole) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
    next();
  };
}
