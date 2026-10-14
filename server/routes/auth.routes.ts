import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { seedStudentDemoData } from '../services/seed-helper.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name is required'),
  college: z.string().optional(),
  course: z.string().optional(),
  currentSemester: z.number().int().min(1).max(12).optional(),
  monthlyAllowance: z.number().nonnegative().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  college: z.string().optional(),
  course: z.string().optional(),
  currentSemester: z.number().int().min(1).max(12).optional(),
  monthlyAllowance: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  theme: z.enum(['dark', 'light']).optional(),
  runwayBufferDays: z.number().int().min(5).max(120).optional(),
  budgetWarningThresh: z.number().int().min(50).max(100).optional()
});

// Register
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name, college, course, currentSemester, monthlyAllowance } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        college: college || 'Indian Institute of Technology (IIT) Delhi',
        course: course || 'B.Tech Computer Science',
        currentSemester: currentSemester || 4,
        monthlyAllowance: monthlyAllowance || 12000,
        settings: {
          create: {
            theme: 'dark',
            runwayBufferDays: 30,
            enableAlerts: true,
            budgetWarningThresh: 80,
            currencySymbol: '₹'
          }
        }
      },
      include: { settings: true }
    });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        college: user.college,
        course: user.course,
        currentSemester: user.currentSemester,
        monthlyAllowance: user.monthlyAllowance,
        isDemo: user.isDemo,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// Login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { settings: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        college: user.college,
        course: user.course,
        currentSemester: user.currentSemester,
        monthlyAllowance: user.monthlyAllowance,
        isDemo: user.isDemo,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal login error.' });
  }
});

// Quick Demo Login / Setup (Requirement 6: Clearly labeled demo data, isolated from registered users)
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const demoEmail = 'demo.student@yukti.in';
    let demoUser = await prisma.user.findUnique({
      where: { email: demoEmail },
      include: { settings: true }
    });

    if (!demoUser) {
      demoUser = await seedStudentDemoData(demoEmail);
    }

    const token = jwt.sign({ userId: demoUser.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.json({
      message: 'Logged in to interactive Demo Student account',
      token,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        college: demoUser.college,
        course: demoUser.course,
        currentSemester: demoUser.currentSemester,
        monthlyAllowance: demoUser.monthlyAllowance,
        isDemo: true,
        settings: demoUser.settings
      }
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Failed to initialize demo account.' });
  }
});

// Reset Demo Data (Requirement 6: clearly isolated, provides a way to reset demo data)
router.post('/demo-reset', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isDemo) {
      return res.status(403).json({ error: 'Reset is only allowed on Demo accounts.' });
    }

    // Re-seed demo data for this user
    await seedStudentDemoData(user.email, true);

    return res.json({ message: 'Demo account data successfully reset to clean default demonstration state.' });
  } catch (error) {
    console.error('Demo reset error:', error);
    return res.status(500).json({ error: 'Failed to reset demo data.' });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { settings: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        college: user.college,
        course: user.course,
        currentSemester: user.currentSemester,
        monthlyAllowance: user.monthlyAllowance,
        currency: user.currency,
        isDemo: user.isDemo,
        settings: user.settings
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// Update Profile & Preferences
router.put('/profile', requireAuth, validateBody(profileSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, college, course, currentSemester, monthlyAllowance, currency, theme, runwayBufferDays, budgetWarningThresh } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        college,
        course,
        currentSemester,
        monthlyAllowance,
        currency,
        settings: {
          upsert: {
            create: {
              theme: theme || 'dark',
              runwayBufferDays: runwayBufferDays || 30,
              budgetWarningThresh: budgetWarningThresh || 80
            },
            update: {
              theme,
              runwayBufferDays,
              budgetWarningThresh
            }
          }
        }
      },
      include: { settings: true }
    });

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        college: updatedUser.college,
        course: updatedUser.course,
        currentSemester: updatedUser.currentSemester,
        monthlyAllowance: updatedUser.monthlyAllowance,
        currency: updatedUser.currency,
        isDemo: updatedUser.isDemo,
        settings: updatedUser.settings
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
