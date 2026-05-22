import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

const CATEGORIAS = ['MOTOR', 'FRENOS', 'SUSPENSION', 'LLANTAS', 'OTROS'] as const;

const createSchema = Joi.object({
  descripcion: Joi.string().trim().min(1).required(),
  categoria: Joi.string().valid(...CATEGORIAS).default('OTROS'),
  intervaloKm: Joi.number().positive().required(),
  costoEstimado: Joi.number().min(0).required(),
  vehicleId: Joi.number().integer().positive().allow(null),
});

const updateSchema = Joi.object({
  descripcion: Joi.string().trim().min(1),
  categoria: Joi.string().valid(...CATEGORIAS),
  intervaloKm: Joi.number().positive(),
  costoEstimado: Joi.number().min(0),
});

const seedSchema = Joi.object({
  vehicleId: Joi.number().integer().positive().required(),
});

const PLAN_KIA_RIO_XCITE: Array<{ descripcion: string; categoria: string; intervaloKm: number; costoEstimado: number }> = [
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
      const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;
      const where = vehicleId ? { vehicleId } : {};
      const maintenances = await prisma.maintenance.findMany({ where, orderBy: { id: 'asc' } });
      res.json({ maintenances });
    } catch (error) {
      console.error('Error listing maintenances:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      if (value.vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: value.vehicleId } });
        if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });
      }

      const maintenance = await prisma.maintenance.create({ data: value });
      res.status(201).json({ maintenance });
    } catch (error) {
      console.error('Error creating maintenance:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { error, value } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const exists = await prisma.maintenance.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: 'Mantenimiento no encontrado' });

      const maintenance = await prisma.maintenance.update({ where: { id }, data: value });
      res.json({ maintenance });
    } catch (error) {
      console.error('Error updating maintenance:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const exists = await prisma.maintenance.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: 'Mantenimiento no encontrado' });

      await prisma.maintenance.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async seedPlan(req: Request, res: Response) {
    try {
      const { error, value } = seedSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const vehicle = await prisma.vehicle.findUnique({ where: { id: value.vehicleId } });
      if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });

      const created = await Promise.all(
        PLAN_KIA_RIO_XCITE.map(p =>
          prisma.maintenance.create({ data: { ...p, vehicleId: value.vehicleId } })
        )
      );
      res.status(201).json({ maintenances: created });
    } catch (error) {
      console.error('Error seeding maintenance plan:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async alerts(req: Request, res: Response) {
    try {
      const vehicleId = Number(req.query.vehicleId);
      if (!vehicleId) return res.status(400).json({ error: 'vehicleId es requerido' });

      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });

      const maintenances = await prisma.maintenance.findMany({
        where: { vehicleId },
        orderBy: { intervaloKm: 'asc' },
      });

      const alerts = maintenances
        .map(m => ({ ...m, remainingKm: m.intervaloKm - vehicle.kilometrajeActual }))
        .filter(m => m.remainingKm <= 1000);

      res.json({ alerts });
    } catch (error) {
      console.error('Error getting maintenance alerts:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
