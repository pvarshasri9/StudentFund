import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const commitmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
  category: z.string().default('Tuition'),
  notes: z.string().optional()
});

const payCommitmentSchema = z.object({
  paymentAmount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.string().default('UPI'),
  createExpenseRecord: z.boolean().default(true),
  paymentDate: z.string().optional()
});

// GET all college commitments with priority grouping and summary
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, priority } = req.query;

    const where: any = { userId };
    if (status && typeof status === 'string') where.status = status;
    if (priority && typeof priority === 'string') where.priority = priority;

    const items = await prisma.collegeCommitment.findMany({
      where,
      orderBy: [
        { priority: 'asc' }, // HIGH first
        { dueDate: 'asc' }
      ]
    });

    const now = new Date();
    const totalAmount = items.reduce((s, c) => s + c.amount, 0);
    const totalPaid = items.reduce((s, c) => s + c.paidAmount, 0);
    const totalOutstanding = totalAmount - totalPaid;

    const upcomingWithin14Days = items.filter(c => {
      if (c.status === 'PAID') return false;
      const due = new Date(c.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
      return diffDays <= 14 && diffDays >= 0;
    });

    const overdue = items.filter(c => {
      if (c.status === 'PAID') return false;
      const due = new Date(c.dueDate);
      return due < now;
    });

    return res.json({
      items,
      summary: {
        totalAmount: Math.round(totalAmount),
        totalPaid: Math.round(totalPaid),
        totalOutstanding: Math.round(totalOutstanding),
        upcomingWithin14DaysCount: upcomingWithin14Days.length,
        upcomingWithin14DaysAmount: Math.round(upcomingWithin14Days.reduce((s, c) => s + (c.amount - c.paidAmount), 0)),
        overdueCount: overdue.length,
        overdueAmount: Math.round(overdue.reduce((s, c) => s + (c.amount - c.paidAmount), 0))
      }
    });
  } catch (error) {
    console.error('Fetch commitments error:', error);
    return res.status(500).json({ error: 'Failed to fetch college commitments.' });
  }
});

// POST create commitment
router.post('/', requireAuth, validateBody(commitmentSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, amount, dueDate, priority, category, notes } = req.body;

    const commitment = await prisma.collegeCommitment.create({
      data: {
        userId,
        title,
        amount,
        dueDate: new Date(dueDate),
        priority,
        category,
        notes,
        status: 'UNPAID',
        paidAmount: 0
      }
    });

    return res.status(201).json({ message: 'College commitment recorded', item: commitment });
  } catch (error) {
    console.error('Create commitment error:', error);
    return res.status(500).json({ error: 'Failed to record college commitment.' });
  }
});

// POST record payment for commitment (with transaction to avoid double counting)
router.post('/:id/pay', requireAuth, validateBody(payCommitmentSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { paymentAmount, paymentMethod, createExpenseRecord, paymentDate } = req.body;

    const commitment = await prisma.collegeCommitment.findFirst({
      where: { id, userId }
    });

    if (!commitment) {
      return res.status(404).json({ error: 'College commitment not found.' });
    }

    const remainingToPay = commitment.amount - commitment.paidAmount;
    if (paymentAmount > remainingToPay) {
      return res.status(400).json({
        error: `Payment amount ₹${paymentAmount} exceeds remaining commitment balance of ₹${remainingToPay}.`
      });
    }

    // Use Prisma transaction for financial consistency
    const result = await prisma.$transaction(async tx => {
      const newPaidAmount = commitment.paidAmount + paymentAmount;
      const newStatus = newPaidAmount >= commitment.amount ? 'PAID' : 'PARTIAL';

      let linkedExpenseId = commitment.expenseId;

      if (createExpenseRecord) {
        const expense = await tx.expense.create({
          data: {
            userId,
            amount: paymentAmount,
            category: commitment.category === 'Tuition' ? 'Tuition' : commitment.category === 'Hostel' ? 'Hostel/Rent' : 'Academic/Books',
            description: `Payment for: ${commitment.title}`,
            date: paymentDate ? new Date(paymentDate) : new Date(),
            isEssential: true,
            paymentMethod: paymentMethod || 'UPI',
            commitmentId: commitment.id,
            notes: `Recorded via College Expense Priority Planner`
          }
        });
        linkedExpenseId = expense.id;
      }

      const updatedCommitment = await tx.collegeCommitment.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          expenseId: linkedExpenseId
        }
      });

      return updatedCommitment;
    });

    return res.json({
      message: 'Payment applied successfully. Financial balance updated.',
      item: result
    });
  } catch (error) {
    console.error('Payment error:', error);
    return res.status(500).json({ error: 'Failed to process payment for commitment.' });
  }
});

// PUT update commitment
router.put('/:id', requireAuth, validateBody(commitmentSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, amount, dueDate, priority, category, notes } = req.body;

    const existing = await prisma.collegeCommitment.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Commitment not found.' });
    }

    if (amount < existing.paidAmount) {
      return res.status(400).json({
        error: `Total amount cannot be less than already paid amount of ₹${existing.paidAmount.toLocaleString('en-IN')}.`
      });
    }

    const newStatus = existing.paidAmount >= amount ? 'PAID' : (existing.paidAmount > 0 ? 'PARTIAL' : 'UNPAID');

    const updated = await prisma.collegeCommitment.update({
      where: { id },
      data: {
        title,
        amount,
        dueDate: new Date(dueDate),
        priority,
        category,
        notes,
        status: newStatus
      }
    });

    return res.json({ message: 'Commitment updated successfully.', item: updated });
  } catch (error) {
    console.error('Update commitment error:', error);
    return res.status(500).json({ error: 'Failed to update commitment.' });
  }
});

// DELETE commitment
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.collegeCommitment.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Commitment not found.' });
    }

    await prisma.$transaction(async tx => {
      await tx.expense.updateMany({
        where: { commitmentId: id, userId },
        data: { commitmentId: null }
      });
      await tx.collegeCommitment.delete({ where: { id } });
    });
    return res.json({ message: 'Commitment deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete commitment.' });
  }
});

export default router;
