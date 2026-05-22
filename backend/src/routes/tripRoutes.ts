import { Router } from 'express';
import { TripController } from '../controllers/tripController';

const router = Router();

// Route to register a new trip
router.post('/trips', TripController.createTrip);

// Route to update an existing trip
router.put('/trips/:id', TripController.updateTrip);

// Route to get monthly profit for a user
router.get('/trips/profit/:userId/:month/:year', TripController.getMonthlyProfit);

export default router;
