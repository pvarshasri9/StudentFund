import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { checkAffordability } from '../services/afford.service.js';

const router = Router();

const checkSchema = z.object({
  itemTitle: z.string().min(1, 'Item title is required'),
  price: z.number().positive('Price must be greater than zero'),
  category: z.string().default('Personal'),
  urgency: z.enum(['WANT', 'NEED']).default('WANT')
});

const confirmPurchaseSchema = z.object({
  itemTitle: z.string().min(1),
  price: z.number().positive(),
  category: z.string(),
  paymentMethod: z.string().default('UPI'),
  isEssential: z.boolean().default(false),
  notes: z.string().optional()
});

// POST simulate affordability
router.post('/simulate', requireAuth, validateBody(checkSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await checkAffordability(userId, req.body);
    return res.json(result);
  } catch (error) {
    console.error('Affordability simulation error:', error);
    return res.status(500).json({ error: 'Failed to simulate affordability.' });
  }
});

// POST convert simulation to real expense (Only when user explicitly confirms!)
router.post('/confirm-purchase', requireAuth, validateBody(confirmPurchaseSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemTitle, price, category, paymentMethod, isEssential, notes } = req.body;

    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: price,
        category,
        description: itemTitle,
        isEssential: !!isEssential,
        paymentMethod: paymentMethod || 'UPI',
        notes: notes || 'Converted from "Can I Afford It?" purchase simulation'
      }
    });

    return res.status(201).json({
      message: `Purchase "${itemTitle}" confirmed and recorded as an expense of ₹${price.toLocaleString('en-IN')}`,
      item: expense
    });
  } catch (error) {
    console.error('Confirm purchase error:', error);
    return res.status(500).json({ error: 'Failed to record confirmed purchase.' });
  }
});

export default router;
