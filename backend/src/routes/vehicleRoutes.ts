import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';

const router = Router();

router.post('/vehicles', VehicleController.createVehicle);

export default router;
