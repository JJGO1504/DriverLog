import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/stats', requireRole('SUPERUSER'), AdminController.getOverview);
router.get('/alerts', requireRole('SUPERUSER'), AdminController.getAlerts);

export default router;
