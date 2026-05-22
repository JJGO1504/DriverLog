import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

const createSchema = Joi.object({
  fecha: Joi.date().required(),
  cantidad: Joi.number().positive().required(),
  kilometraje: Joi.number().min(0).required(),
  costoTotal: Joi.number().min(0).default(0),
  vehicleId: Joi.number().integer().positive().allow(null),
  userId: Joi.number().integer().positive().required(),
});

export class FuelController {
  static async list(req: Request, res: Response) {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const where = userId ? { userId } : {};
      const entries = await prisma.fuelEntry.findMany({
        where,
        orderBy: { fecha: 'desc' },
        include: { vehicle: true },
      });
      res.json({ entries });
    } catch (error) {
      console.error('Error listing fuel entries:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const user = await prisma.user.findUnique({ where: { id: value.userId } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      if (value.vehicleId) {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: value.vehicleId } });
        if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });
      }

      const entry = await prisma.fuelEntry.create({ data: value });
      res.status(201).json({ entry });
    } catch (error) {
      console.error('Error creating fuel entry:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const exists = await prisma.fuelEntry.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: 'Entrada no encontrada' });
      await prisma.fuelEntry.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting fuel entry:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
