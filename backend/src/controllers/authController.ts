import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'driverlog-secret-key-change-in-production';

const userWithoutPassword = (user: any) => {
  const { password, ...rest } = user;
  return rest;
};

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, user: userWithoutPassword(user) });
    } catch (error: any) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ user: userWithoutPassword(user) });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
