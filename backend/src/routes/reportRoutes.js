import express from 'express';
import { getReports, getTrend } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All report routes require authentication
router.use(authenticateToken);

router.get('/', getReports);
router.get('/trend', getTrend);

export default router;

