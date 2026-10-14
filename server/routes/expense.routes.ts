import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

import { getMonthRange } from '../utils/date.js';

const router = Router();

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().optional(),
  isEssential: z.boolean().default(true),
  paymentMethod: z.string().default('UPI'),
  notes: z.string().optional(),
  commitmentId: z.string().optional()
});

// GET all expenses with filtering and summary
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category, isEssential, search, startDate, endDate, month } = req.query;

    const where: any = { userId };

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (isEssential !== undefined) {
      where.isEssential = isEssential === 'true';
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { description: { contains: search } },
        { notes: { contains: search } }
      ];
    }

    if (month && typeof month === 'string') {
      const { start, end } = getMonthRange(month);
      where.date = { gte: start, lt: end };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const items = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const total = items.reduce((sum, e) => sum + e.amount, 0);
    const essentialTotal = items
      .filter(e => e.isEssential)
      .reduce((sum, e) => sum + e.amount, 0);
    const nonEssentialTotal = total - essentialTotal;

    // Grouping by category
    const categoryTotals: Record<string, number> = {};
    for (const e of items) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }

    return res.json({
      items,
      summary: {
        total: Math.round(total),
        essentialTotal: Math.round(essentialTotal),
        nonEssentialTotal: Math.round(nonEssentialTotal),
        essentialRatio: total > 0 ? Math.round((essentialTotal / total) * 100) : 0,
        categoryTotals,
        count: items.length
      }
    });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return res.status(500).json({ error: 'Failed to fetch expense records.' });
  }
});

// POST new expense
router.post('/', requireAuth, validateBody(expenseSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, category, description, date, isEssential, paymentMethod, notes, commitmentId } = req.body;

    const expense = await prisma.expense.create({
      data: {
        userId,
        amount,
        category,
        description,
        date: date ? new Date(date) : new Date(),
        isEssential: isEssential !== undefined ? isEssential : true,
        paymentMethod: paymentMethod || 'UPI',
        notes,
        commitmentId
      }
    });

    return res.status(201).json({ message: 'Expense recorded successfully', item: expense });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ error: 'Failed to record expense.' });
  }
});

// PUT update expense
router.put('/:id', requireAuth, validateBody(expenseSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, category, description, date, isEssential, paymentMethod, notes, commitmentId } = req.body;

    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Expense record not found.' });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount,
        category,
        description,
        date: date ? new Date(date) : existing.date,
        isEssential: isEssential !== undefined ? isEssential : existing.isEssential,
        paymentMethod: paymentMethod || existing.paymentMethod,
        notes,
        commitmentId
      }
    });

    return res.json({ message: 'Expense updated successfully', item: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update expense.' });
  }
});

// DELETE expense
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Expense record not found.' });
    }

    await prisma.$transaction(async tx => {
      // If linked to a college commitment, revert the paidAmount on that commitment
      if (existing.commitmentId) {
        const commitment = await tx.collegeCommitment.findFirst({
          where: { id: existing.commitmentId, userId }
        });
        if (commitment) {
          const newPaidAmount = Math.max(0, commitment.paidAmount - existing.amount);
          const newStatus = newPaidAmount === 0 ? 'UNPAID' : (newPaidAmount >= commitment.amount ? 'PAID' : 'PARTIAL');
          await tx.collegeCommitment.update({
            where: { id: commitment.id },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus,
              expenseId: null
            }
          });
        }
      }

      await tx.expense.delete({ where: { id } });
    });

    return res.json({ message: 'Expense record deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

export default router;
