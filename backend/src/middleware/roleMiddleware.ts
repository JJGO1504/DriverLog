import { Request, Response, NextFunction } from 'express';

export type Role = 'USER' | 'SUPERUSER';

export function getRequestRole(req: Request): Role {
  const rawRole = String(req.headers['x-user-role'] || 'USER').toUpperCase();
  return rawRole === 'SUPERUSER' ? 'SUPERUSER' : 'USER';
}

export function requireRole(requiredRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentRole = getRequestRole(req);
    if (currentRole !== requiredRole) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
    next();
  };
}
