import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class VehicleController {
  static async createVehicle(req: Request, res: Response) {
    try {
      const { marca, modelo, anio } = req.body;
      if (!marca || !modelo || !anio) {
        return res.status(400).json({ error: 'marca, modelo y anio son requeridos' });
      }

      // Provide sensible defaults for other required numeric fields
      const vehicle = await prisma.vehicle.create({
        data: {
          marca,
          modelo,
          anio: Number(anio),
          kilometrajeActual: 0,
          valorCompra: 0,
          valorReventaEstimado: 0,
          vidaUtilKm: 1,
        },
      });

      res.status(201).json({ vehicle });
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
