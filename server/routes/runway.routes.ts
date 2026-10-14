import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { calculateRunway } from '../services/runway.service.js';

const router = Router();

// GET runway calculation and trajectory forecast
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 60;
    const forecastDays = Math.min(180, Math.max(15, days));

    const analysis = await calculateRunway(userId, forecastDays);
    return res.json(analysis);
  } catch (error) {
    console.error('Runway calculation error:', error);
    return res.status(500).json({ error: 'Failed to calculate Money Runway.' });
  }
});

export default router;
