import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

const createSchema = Joi.object({
  tipo: Joi.string().valid('SOAT', 'TECNOMECANICA', 'SEGURO', 'OTRO').required(),
  fechaExpedicion: Joi.date().required(),
  fechaVencimiento: Joi.date().required(),
  vehicleId: Joi.number().integer().positive().required(),
});

export class DocumentController {
  static async listByVehicle(req: Request, res: Response) {
    try {
      const vehicleId = Number(req.params.vehicleId);
      const docs = await prisma.vehicleDocument.findMany({ where: { vehicleId }, orderBy: { fechaVencimiento: 'asc' } });
      res.json(docs);
    } catch (error) {
      console.error('Error listing documents:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const vehicle = await prisma.vehicle.findUnique({ where: { id: value.vehicleId } });
      if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });

      const doc = await prisma.vehicleDocument.create({
        data: {
          tipo: value.tipo,
          fechaExpedicion: new Date(value.fechaExpedicion),
          fechaVencimiento: new Date(value.fechaVencimiento),
          vehicleId: value.vehicleId,
        },
      });
      res.status(201).json(doc);
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const exists = await prisma.vehicleDocument.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: 'Documento no encontrado' });
      await prisma.vehicleDocument.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
