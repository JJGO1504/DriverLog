import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

router.get('/users/:id', UserController.getUserProfile);

export default router;
