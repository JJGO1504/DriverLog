import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserController {
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

      // NOTE: For demo purposes we store password as plain text. In production, hash it.
      const user = await prisma.user.create({
        data: {
          nombre,
          email,
          // store password in a separate table or hash in real apps; using role default
        },
      });

      res.status(201).json({ user });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async createVehicleForUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { marca, modelo, anio } = req.body;
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
          kilometrajeActual: 0,
          valorCompra: 0,
          valorReventaEstimado: 0,
          vidaUtilKm: 1,
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
