import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

// Create a new user
router.post('/users', UserController.createUser);

// Get user profile
router.get('/users/:id', UserController.getUserProfile);

// Update user
router.patch('/users/:id', UserController.updateUser);

// Get user vehicles
router.get('/users/:id/vehicles', UserController.getUserVehicles);

// Get monthly stats
router.get('/users/:id/stats', UserController.getMonthlyStats);

// Create a vehicle and associate it to a user
router.post('/users/:id/vehicles', UserController.createVehicleForUser);

// Update a vehicle's operational details
router.patch('/vehicles/:id', UserController.updateVehicle);

export default router;
