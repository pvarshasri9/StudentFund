import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { getAuthoritativeFinancialSummary } from '../services/financial-calculator.service.js';

const router = Router();

// GET /api/financials/summary
router.get('/summary', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const summary = await getAuthoritativeFinancialSummary(userId);
    return res.json({ summary, ...summary });
  } catch (error) {
    console.error('Fetch financials summary error:', error);
    return res.status(500).json({ error: 'Failed to compute authoritative financial summary.' });
  }
});

export default router;
