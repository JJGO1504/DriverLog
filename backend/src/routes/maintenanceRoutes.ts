import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenanceController';

const router = Router();

router.get('/maintenances', MaintenanceController.list);
router.post('/maintenances', MaintenanceController.create);
router.put('/maintenances/:id', MaintenanceController.update);
router.delete('/maintenances/:id', MaintenanceController.remove);
router.post('/maintenances/seed', MaintenanceController.seedPlan);
router.get('/maintenances/alerts', MaintenanceController.alerts);

export default router;
