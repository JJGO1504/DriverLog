import { Router } from 'express';
import { FuelController } from '../controllers/fuelController';

const router = Router();

router.get('/fuel', FuelController.list);
router.post('/fuel', FuelController.create);
router.delete('/fuel/:id', FuelController.remove);

export default router;
