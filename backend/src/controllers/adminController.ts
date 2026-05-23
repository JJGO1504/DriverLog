import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AdminService } from '../services/adminService';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export class AdminController {
  static async getOverview(req: Request, res: Response) {
    try {
      const overview = await AdminService.getOverview();
      res.json(overview);
    } catch (error: any) {
      console.error('Error fetching admin overview:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getAlerts(req: Request, res: Response) {
    try {
      const alerts = await AdminService.getMaintenanceAlerts();
      res.json({ alerts });
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getMetrics(req: AuthRequest, res: Response) {
    try {
      const metrics = await AdminService.getMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error('Error fetching admin metrics:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async updateUserRole(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { role } = req.body;
      if (!role || !['USER', 'SUPERUSER'].includes(role)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, nombre: true, email: true, role: true, avatarUrl: true },
      });
      res.json({ user });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async createAdmin(req: AuthRequest, res: Response) {
    try {
      const { nombre, email, password } = req.body;
      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'nombre, email y password son requeridos' });
      }
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { nombre, email, password: hashedPassword, role: 'SUPERUSER' },
        select: { id: true, nombre: true, email: true, role: true, avatarUrl: true },
      });
      res.status(201).json({ user });
    } catch (error: any) {
      console.error('Error creating admin:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
