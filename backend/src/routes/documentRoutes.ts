import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';

const router = Router();

router.get('/vehicles/:vehicleId/documents', DocumentController.listByVehicle);
router.post('/vehicles/:vehicleId/documents', DocumentController.create);
router.delete('/documents/:id', DocumentController.remove);

export default router;
