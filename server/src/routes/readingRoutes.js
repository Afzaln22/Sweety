import express from 'express';
import {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
} from '../controllers/readingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateReading } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All reading routes require authentication
router.use(authenticateToken);

router.post('/', validateReading, createReading);
router.get('/', getReadings);
router.get('/:id', getReadingById);
router.put('/:id', validateReading, updateReading);
router.delete('/:id', deleteReading);

export default router;
