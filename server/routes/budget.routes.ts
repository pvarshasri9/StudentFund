import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { getMonthRange } from '../utils/date.js';

const router = Router();

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  limitAmount: z.number().positive('Budget limit must be greater than zero'),
  notes: z.string().optional()
});

// GET budgets for a given month (defaults to current month) with dynamic calculations
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = (req.query.month as string) || currentMonthStr;

    // Get all budgets for that month
    const budgets = await prisma.budget.findMany({
      where: { userId, month }
    });

    // Get all expenses for that month to compute actual spend
    const { start, end } = getMonthRange(month);

    const monthExpenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: start, lt: end }
      }
    });

    const totalSpentMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);

    // Compute status for each budget
    const computedBudgets = budgets.map(b => {
      let spent = 0;
      if (b.category === 'OVERALL') {
        spent = totalSpentMonth;
      } else {
        spent = monthExpenses
          .filter(e => e.category === b.category)
          .reduce((s, e) => s + e.amount, 0);
      }

      const remaining = b.limitAmount - spent;
      const utilizationRate = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;

      let warningStatus: 'NORMAL' | 'WARNING_80' | 'EXCEEDED' = 'NORMAL';
      if (utilizationRate >= 100) {
        warningStatus = 'EXCEEDED';
      } else if (utilizationRate >= 80) {
        warningStatus = 'WARNING_80';
      }

      return {
        ...b,
        spent: Math.round(spent),
        remaining: Math.round(remaining),
        utilizationRate: Math.round(utilizationRate),
        warningStatus
      };
    });

    return res.json({
      month,
      budgets: computedBudgets,
      totalBudgeted: Math.round(budgets.reduce((s, b) => s + b.limitAmount, 0)),
      totalSpentInMonth: Math.round(totalSpentMonth)
    });
  } catch (error) {
    console.error('Fetch budgets error:', error);
    return res.status(500).json({ error: 'Failed to fetch budgets.' });
  }
});

// POST create or upsert budget
router.post('/', requireAuth, validateBody(budgetSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category, month, limitAmount, notes } = req.body;

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month: {
          userId,
          category,
          month
        }
      },
      create: {
        userId,
        category,
        month,
        limitAmount,
        notes
      },
      update: {
        limitAmount,
        notes
      }
    });

    return res.status(201).json({ message: 'Budget set successfully', item: budget });
  } catch (error) {
    console.error('Create budget error:', error);
    return res.status(500).json({ error: 'Failed to save budget.' });
  }
});

// DELETE budget
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    await prisma.budget.delete({ where: { id } });
    return res.json({ message: 'Budget deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete budget.' });
  }
});

export default router;
