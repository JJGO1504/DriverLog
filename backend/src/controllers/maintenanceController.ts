import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIAS = ['MOTOR', 'FRENOS', 'SUSPENSION', 'LLANTAS', 'OTROS'] as const;

const PLAN_KIA_RIO_XCITE = [
  { descripcion: 'Cambio de aceite y filtro', categoria: 'MOTOR', intervaloKm: 5000, costoEstimado: 180000 },
  { descripcion: 'Rotación y balanceo de llantas', categoria: 'LLANTAS', intervaloKm: 10000, costoEstimado: 80000 },
  { descripcion: 'Revisión de frenos (pastillas y discos)', categoria: 'FRENOS', intervaloKm: 15000, costoEstimado: 250000 },
  { descripcion: 'Cambio de filtro de aire', categoria: 'MOTOR', intervaloKm: 20000, costoEstimado: 60000 },
  { descripcion: 'Cambio de bujías', categoria: 'MOTOR', intervaloKm: 30000, costoEstimado: 120000 },
  { descripcion: 'Cambio de correa de distribución', categoria: 'MOTOR', intervaloKm: 60000, costoEstimado: 450000 },
  { descripcion: 'Alineación y suspensión', categoria: 'SUSPENSION', intervaloKm: 20000, costoEstimado: 150000 },
  { descripcion: 'Cambio de líquido de frenos', categoria: 'FRENOS', intervaloKm: 40000, costoEstimado: 90000 },
  { descripcion: 'Cambio de refrigerante', categoria: 'MOTOR', intervaloKm: 50000, costoEstimado: 100000 },
  { descripcion: 'Cambio de amortiguadores', categoria: 'SUSPENSION', intervaloKm: 80000, costoEstimado: 600000 },
];

export class MaintenanceController {
  static async list(req: Request, res: Response) {
    try {
      const { vehicleId } = req.query;
      const where = vehicleId ? { vehicleId: Number(vehicleId) } : {};
      const maintenances = await prisma.maintenance.findMany({ where, orderBy: { id: 'asc' } });
      res.json({ maintenances });
    } catch (error: any) {
      console.error('Error listing maintenances:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { descripcion, categoria, intervaloKm, costoEstimado, vehicleId } = req.body;
      if (!descripcion || !intervaloKm || !costoEstimado) {
        return res.status(400).json({ error: 'descripcion, intervaloKm y costoEstimado son requeridos' });
      }
      const cat = categoria && CATEGORIAS.includes(categoria) ? categoria : 'OTROS';
      const maintenance = await prisma.maintenance.create({
        data: {
          descripcion,
          categoria: cat,
          intervaloKm: Number(intervaloKm),
          costoEstimado: Number(costoEstimado),
          vehicleId: vehicleId ? Number(vehicleId) : null,
        },
      });
      res.status(201).json({ maintenance });
    } catch (error: any) {
      console.error('Error creating maintenance:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { descripcion, categoria, intervaloKm, costoEstimado } = req.body;
      const data: any = {};
      if (descripcion) data.descripcion = descripcion;
      if (categoria && CATEGORIAS.includes(categoria)) data.categoria = categoria;
      if (intervaloKm) data.intervaloKm = Number(intervaloKm);
      if (costoEstimado) data.costoEstimado = Number(costoEstimado);
      const maintenance = await prisma.maintenance.update({ where: { id: Number(id) }, data });
      res.json({ maintenance });
    } catch (error: any) {
      console.error('Error updating maintenance:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.maintenance.delete({ where: { id: Number(id) } });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting maintenance:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async seedPlan(req: Request, res: Response) {
    try {
      const { vehicleId } = req.body;
      if (!vehicleId) return res.status(400).json({ error: 'vehicleId es requerido' });
      const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } });
      if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });
      const created = await Promise.all(
        PLAN_KIA_RIO_XCITE.map(p =>
          prisma.maintenance.create({
            data: { ...p, vehicleId: Number(vehicleId) },
          })
        )
      );
      res.status(201).json({ maintenances: created });
    } catch (error: any) {
      console.error('Error seeding maintenance plan:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async alerts(req: Request, res: Response) {
    try {
      const { vehicleId } = req.query;
      if (!vehicleId) return res.status(400).json({ error: 'vehicleId es requerido' });
      const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } });
      if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });
      const maintenances = await prisma.maintenance.findMany({
        where: { vehicleId: Number(vehicleId) },
        orderBy: { intervaloKm: 'asc' },
      });
      const alerts = maintenances
        .map(m => {
          const remaining = m.intervaloKm - vehicle.kilometrajeActual;
          return { ...m, remainingKm: remaining };
        })
        .filter(m => m.remainingKm <= 1000);
      res.json({ alerts });
    } catch (error: any) {
      console.error('Error getting maintenance alerts:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
