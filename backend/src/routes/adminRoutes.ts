import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.get('/stats', requireRole('SUPERUSER'), AdminController.getOverview);
router.get('/alerts', requireRole('SUPERUSER'), AdminController.getAlerts);
router.get('/metrics', requireRole('SUPERUSER'), AdminController.getMetrics);
router.patch('/users/:id/role', requireRole('SUPERUSER'), AdminController.updateUserRole);
router.post('/create-admin', requireRole('SUPERUSER'), AdminController.createAdmin);

export default router;
