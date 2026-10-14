import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { generateOverviewReport, exportTransactionsCsv } from '../services/report.service.js';

const router = Router();

// GET financial overview metrics
router.get('/overview', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const report = await generateOverviewReport(userId, start, end);
    return res.json(report);
  } catch (error) {
    console.error('Overview report error:', error);
    return res.status(500).json({ error: 'Failed to generate financial overview.' });
  }
});

// GET export CSV of all transactions
router.get('/export-csv', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const csvContent = await exportTransactionsCsv(userId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="studentfund-ledger-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

export default router;
