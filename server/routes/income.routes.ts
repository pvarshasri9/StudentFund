import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const incomeSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  source: z.string().min(1, 'Source is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().optional(),
  isExpected: z.boolean().default(false),
  notes: z.string().optional()
});

// GET all incomes with filtering
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { source, isExpected, search, startDate, endDate } = req.query;

    const where: any = { userId };

    if (source && typeof source === 'string') {
      where.source = source;
    }

    if (isExpected !== undefined) {
      where.isExpected = isExpected === 'true';
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { description: { contains: search } },
        { notes: { contains: search } }
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const items = await prisma.income.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const receivedTotal = items
      .filter(i => !i.isExpected)
      .reduce((sum, i) => sum + i.amount, 0);

    const expectedTotal = items
      .filter(i => i.isExpected)
      .reduce((sum, i) => sum + i.amount, 0);

    return res.json({
      items,
      summary: {
        totalReceived: Math.round(receivedTotal),
        totalExpected: Math.round(expectedTotal),
        count: items.length
      }
    });
  } catch (error) {
    console.error('Fetch incomes error:', error);
    return res.status(500).json({ error: 'Failed to fetch income records.' });
  }
});

// POST new income
router.post('/', requireAuth, validateBody(incomeSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { amount, source, description, date, isExpected, notes } = req.body;

    const income = await prisma.income.create({
      data: {
        userId,
        amount,
        source,
        description,
        date: date ? new Date(date) : new Date(),
        isExpected: !!isExpected,
        receivedDate: !isExpected ? (date ? new Date(date) : new Date()) : null,
        notes
      }
    });

    return res.status(201).json({ message: 'Income recorded successfully', item: income });
  } catch (error) {
    console.error('Create income error:', error);
    return res.status(500).json({ error: 'Failed to record income.' });
  }
});

// PUT update income
router.put('/:id', requireAuth, validateBody(incomeSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, source, description, date, isExpected, notes } = req.body;

    const existing = await prisma.income.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Income record not found.' });
    }

    const updated = await prisma.income.update({
      where: { id },
      data: {
        amount,
        source,
        description,
        date: date ? new Date(date) : existing.date,
        isExpected: !!isExpected,
        receivedDate: !isExpected ? (date ? new Date(date) : new Date()) : null,
        notes
      }
    });

    return res.json({ message: 'Income record updated', item: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update income record.' });
  }
});

// DELETE income
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.income.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Income record not found.' });
    }

    await prisma.income.delete({ where: { id } });
    return res.json({ message: 'Income record deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete income record.' });
  }
});

export default router;
