import { Request, Response } from 'express';
import { AdminService } from '../services/adminService';

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
}
