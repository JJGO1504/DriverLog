import { Request, Response } from 'express';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { TripService } from '../services/tripService';

const prisma = new PrismaClient();

// Validation schemas
const createTripSchema = Joi.object({
  fecha: Joi.date().required(),
  ingresoBruto: Joi.number().positive().required(),
  kmRecorridos: Joi.number().positive().required(),
  gastoCombustible: Joi.number().min(0).required(),
  userId: Joi.number().integer().positive().required(),
  vehicleId: Joi.number().integer().positive().required(),
});

const getMonthlyProfitSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).required(),
});

export class TripController {
  // Register a new trip
  static async createTrip(req: Request, res: Response) {
    try {
      const { error, value } = createTripSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // Check if user and vehicle exist
      const user = await prisma.user.findUnique({ where: { id: value.userId } });
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const vehicle = await prisma.vehicle.findUnique({ where: { id: value.vehicleId } });
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehículo no encontrado' });
      }

      const trip = await prisma.trip.create({
        data: value,
        include: {
          vehicle: true,
        },
      });

      // Calculate real net profit
      const netProfit = TripService.calculateRealNetProfit(trip, trip.vehicle);

      res.status(201).json({ trip, netProfit });
    } catch (error: any) {
      console.error('Error creating trip:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async updateTrip(req: Request, res: Response) {
    try {
      const tripId = parseInt(req.params.id, 10);
      const { ingresoBruto, kmRecorridos, gastoCombustible } = req.body;
      if (ingresoBruto === undefined || kmRecorridos === undefined) {
        return res.status(400).json({ error: 'ingresoBruto y kmRecorridos son requeridos' });
      }
      const trip = await prisma.trip.update({
        where: { id: tripId },
        data: {
          ingresoBruto: Number(ingresoBruto),
          kmRecorridos: Number(kmRecorridos),
          gastoCombustible: gastoCombustible !== undefined ? Number(gastoCombustible) : undefined,
        },
        include: { vehicle: true },
      });
      res.json({ trip });
    } catch (error: any) {
      console.error('Error updating trip:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Get monthly profit for a user
  static async getMonthlyProfit(req: Request, res: Response) {
    try {
      const params = {
        userId: parseInt(req.params.userId),
        month: parseInt(req.params.month),
        year: parseInt(req.params.year),
      };

      const { error } = getMonthlyProfitSchema.validate(params);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: params.userId } });
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const profit = await TripService.getMonthlyProfit(params.userId, params.month, params.year);

      res.json({ profit });
    } catch (error: any) {
      console.error('Error calculating monthly profit:', error);
      if (error.message.includes('Mes debe') || error.message.includes('Año inválido')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async exportCSV(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const trips = await prisma.trip.findMany({
        where: { userId },
        include: { vehicle: true },
        orderBy: { fecha: 'desc' },
      });

      const sep = ';';
      const header = `Fecha${sep}Ingreso Bruto${sep}Km Recorridos${sep}Gasto Combustible${sep}Ganancia Neta${sep}Vehiculo`;
      const rows = trips.map(t => {
        const net = t.ingresoBruto - t.gastoCombustible;
        return `${t.fecha.toISOString().slice(0, 10)}${sep}${t.ingresoBruto.toFixed(0)}${sep}${t.kmRecorridos.toFixed(1)}${sep}${t.gastoCombustible.toFixed(0)}${sep}${net.toFixed(0)}${sep}${t.vehicle ? `${t.vehicle.marca} ${t.vehicle.modelo}` : t.vehicleId}`;
      });

      const totalGross = trips.reduce((s, t) => s + t.ingresoBruto, 0);
      const totalKm = trips.reduce((s, t) => s + t.kmRecorridos, 0);
      const totalFuel = trips.reduce((s, t) => s + t.gastoCombustible, 0);
      const totalNet = totalGross - totalFuel;
      const totalRow = `TOTALES${sep}${totalGross.toFixed(0)}${sep}${totalKm.toFixed(1)}${sep}${totalFuel.toFixed(0)}${sep}${totalNet.toFixed(0)}${sep}"${trips.length} viajes"`;

      const csv = `sep=${sep}\n${header}\n${rows.join('\n')}\n\n${totalRow}`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=viajes_${userId}.csv`);
      res.send(csv);
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
