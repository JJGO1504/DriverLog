import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/auth/login', AuthController.login);
router.get('/auth/me', authMiddleware, AuthController.me);

export default router;
