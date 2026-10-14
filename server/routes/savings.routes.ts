import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  targetDate: z.string().min(1, 'Target date is required'),
  category: z.string().default('GENERAL'),
  notes: z.string().optional()
});

const contributionSchema = z.object({
  amount: z.number().positive('Contribution must be greater than zero'),
  notes: z.string().optional(),
  date: z.string().optional()
});

// GET all savings goals with progress and contributions
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      include: {
        contributions: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { targetDate: 'asc' }
    });

    const now = new Date();

    const goalsWithMetrics = goals.map(g => {
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      const progressPercent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

      // Calculate required monthly savings
      const targetTime = new Date(g.targetDate).getTime();
      const diffMonths = Math.max(1, Math.ceil((targetTime - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const requiredMonthlySavings = Math.ceil(remainingAmount / diffMonths);

      return {
        ...g,
        remainingAmount: Math.round(remainingAmount),
        progressPercent,
        monthsRemaining: diffMonths,
        requiredMonthlySavings
      };
    });

    const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

    return res.json({
      goals: goalsWithMetrics,
      summary: {
        totalSaved: Math.round(totalSaved),
        totalTarget: Math.round(totalTarget),
        overallProgress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
        activeGoalsCount: goals.filter(g => !g.isCompleted).length
      }
    });
  } catch (error) {
    console.error('Fetch savings goals error:', error);
    return res.status(500).json({ error: 'Failed to fetch savings goals.' });
  }
});

// POST create savings goal
router.post('/', requireAuth, validateBody(goalSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, targetAmount, targetDate, category, notes } = req.body;

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        title,
        targetAmount,
        targetDate: new Date(targetDate),
        category,
        notes,
        currentAmount: 0,
        isCompleted: false
      }
    });

    return res.status(201).json({ message: 'Savings goal created', item: goal });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create savings goal.' });
  }
});

// POST contribute to savings goal
router.post('/:id/contribute', requireAuth, validateBody(contributionSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, notes, date } = req.body;

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found.' });
    }

    const result = await prisma.$transaction(async tx => {
      const newAmount = goal.currentAmount + amount;
      const isCompleted = newAmount >= goal.targetAmount;

      const contribution = await tx.savingsContribution.create({
        data: {
          goalId: goal.id,
          userId,
          amount,
          date: date ? new Date(date) : new Date(),
          notes
        }
      });

      const updatedGoal = await tx.savingsGoal.update({
        where: { id },
        data: {
          currentAmount: newAmount,
          isCompleted
        }
      });

      return { contribution, updatedGoal };
    });

    return res.json({
      message: `Successfully contributed ₹${amount.toLocaleString('en-IN')} to "${goal.title}"`,
      item: result.updatedGoal
    });
  } catch (error) {
    console.error('Contribute error:', error);
    return res.status(500).json({ error: 'Failed to record savings contribution.' });
  }
});

// PUT update savings goal
router.put('/:id', requireAuth, validateBody(goalSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, targetAmount, targetDate, category, notes } = req.body;

    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found.' });
    }

    const isCompleted = goal.currentAmount >= targetAmount;

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        title,
        targetAmount,
        targetDate: new Date(targetDate),
        category,
        notes,
        isCompleted
      }
    });

    return res.json({ message: 'Savings goal updated.', item: updated });
  } catch (error) {
    console.error('Update savings goal error:', error);
    return res.status(500).json({ error: 'Failed to update savings goal.' });
  }
});

// DELETE savings goal
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found.' });
    }

    await prisma.savingsGoal.delete({ where: { id } });
    return res.json({ message: 'Savings goal deleted.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete savings goal.' });
  }
});

export default router;
