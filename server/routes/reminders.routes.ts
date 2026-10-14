import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  category: z.string().default('COLLEGE_FEE'),
  amount: z.number().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
  notes: z.string().optional()
});

// GET all reminders with overdue & upcoming sorting
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const items = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const overdue = items.filter(r => !r.isCompleted && new Date(r.dueDate) < now);
    const upcoming = items.filter(r => !r.isCompleted && new Date(r.dueDate) >= now);
    const completed = items.filter(r => r.isCompleted);

    return res.json({
      items,
      overdue,
      upcoming,
      completed,
      stats: {
        total: items.length,
        pending: items.length - completed.length,
        overdueCount: overdue.length
      }
    });
  } catch (error) {
    console.error('Fetch reminders error:', error);
    return res.status(500).json({ error: 'Failed to fetch reminders.' });
  }
});

// POST create reminder
router.post('/', requireAuth, validateBody(reminderSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, dueDate, category, amount, priority, notes } = req.body;

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title,
        dueDate: new Date(dueDate),
        category,
        amount: amount || null,
        priority,
        notes,
        isCompleted: false
      }
    });

    return res.status(201).json({ message: 'Reminder set successfully', item: reminder });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create reminder.' });
  }
});

// PATCH toggle completion
router.patch('/:id/toggle', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: { isCompleted: !existing.isCompleted }
    });

    return res.json({ message: 'Reminder status updated', item: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle reminder status.' });
  }
});

// DELETE reminder
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }

    await prisma.reminder.delete({ where: { id } });
    return res.json({ message: 'Reminder deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete reminder.' });
  }
});

export default router;
