import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

// Create a new user
router.post('/users', UserController.createUser);

// Get user profile
router.get('/users/:id', UserController.getUserProfile);

// Create a vehicle and associate it to a user
router.post('/users/:id/vehicles', UserController.createVehicleForUser);

export default router;
