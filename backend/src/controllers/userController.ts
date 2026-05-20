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
}
