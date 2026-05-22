import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserController {
  static async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { nombre } = req.body;
      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'Nombre es requerido' });
      }
      const user = await prisma.user.update({
        where: { id: userId },
        data: { nombre: nombre.trim() },
      });
      res.json({ user });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getUserVehicles(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      const vehicles = await prisma.vehicle.findMany({ where: { ownerId: userId } });
      res.json({ vehicles });
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getMonthlyStats(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { month, year } = req.query;
      const m = parseInt(month as string) || new Date().getMonth() + 1;
      const y = parseInt(year as string) || new Date().getFullYear();
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);

      const trips = await prisma.trip.findMany({
        where: { userId, fecha: { gte: start, lt: end } },
        include: { vehicle: true },
      });

      const totalGross = trips.reduce((s, t) => s + t.ingresoBruto, 0);
      const totalFuel = trips.reduce((s, t) => s + t.gastoCombustible, 0);
      const totalKm = trips.reduce((s, t) => s + t.kmRecorridos, 0);

      res.json({ gross: totalGross, fuel: totalFuel, km: totalKm, count: trips.length });
    } catch (error: any) {
      console.error('Error fetching monthly stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getUserProfile(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          trips: {
            include: { vehicle: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const { nombre, email, password } = req.body;
      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'nombre, email y password son requeridos' });
      }

      // Simple check for existing email
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          nombre,
          email,
          password: hashedPassword,
        },
      });

      res.status(201).json({ user });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async updateVehicle(req: Request, res: Response) {
    try {
      const vehicleId = parseInt(req.params.id, 10);
      const { placa, kilometrajeActual, valorCompra, valorAlquiler, vidaUtilKm, rendimientoKmGalon } = req.body;

      const vehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          ...(placa !== undefined && { placa }),
          ...(kilometrajeActual !== undefined && { kilometrajeActual: Number(kilometrajeActual) }),
          ...(valorCompra !== undefined && { valorCompra: Number(valorCompra) }),
          ...(valorAlquiler !== undefined && { valorAlquiler: Number(valorAlquiler) }),
          ...(vidaUtilKm !== undefined && { vidaUtilKm: Number(vidaUtilKm) }),
          ...(rendimientoKmGalon !== undefined && { rendimientoKmGalon: Number(rendimientoKmGalon) }),
        },
      });

      res.json({ vehicle });
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async createVehicleForUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { marca, modelo, anio, placa } = req.body;
      if (!marca || !modelo || !anio) {
        return res.status(400).json({ error: 'marca, modelo y anio son requeridos' });
      }

      // ensure user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const vehicle = await prisma.vehicle.create({
        data: {
          marca,
          modelo,
          anio: Number(anio),
          placa: placa || '',
          kilometrajeActual: 0,
          valorCompra: 0,
          valorReventaEstimado: 0,
          vidaUtilKm: 1,
          rendimientoKmGalon: 1,
          owner: {
            connect: { id: userId },
          },
        },
      });

      res.status(201).json({ vehicle });
    } catch (error: any) {
      console.error('Error creating vehicle for user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
