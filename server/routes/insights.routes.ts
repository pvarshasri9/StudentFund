import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { generateSmartInsights } from '../services/insights.service.js';

const router = Router();

// GET all smart insights
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const insights = await generateSmartInsights(userId);
    return res.json({ insights, count: insights.length });
  } catch (error) {
    console.error('Fetch insights error:', error);
    return res.status(500).json({ error: 'Failed to generate financial insights.' });
  }
});

export default router;
