import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

export interface LessonModule {
  id: string;
  title: string;
  category: string;
  readTime: string;
  description: string;
  keyTakeaway: string;
  content: string[];
  studentCaseStudy: {
    studentName: string;
    scenario: string;
    mistake: string;
    smartSolution: string;
  };
  quiz: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }[];
}

const literacyModules: LessonModule[] = [
  {
    id: 'budgeting-101',
    title: '50-30-20 Rule Adapted for Indian College Students',
    category: 'Budgeting & Foundations',
    readTime: '4 min read',
    description: 'Why the classic corporate budgeting rule breaks for hostelers, and how to adapt it to irregular allowances.',
    keyTakeaway: 'Split living costs into 60% Essentials (mess, books, rent), 25% Discretionary (canteen, outings), and 15% College Buffer/Savings.',
    content: [
      'Standard personal finance textbooks recommend allocating 50% to needs, 30% to wants, and 20% to savings. However, college students face fixed institutional costs like hostel mess advances and semester exam fees.',
      'A practical student rule is the "60-25-15 Campus Rule": 60% for academic dues and hostel subsistence, 25% for social and personal flexibility, and 15% dedicated to your semester runway buffer.',
      'Always fund your essential academic commitments immediately upon receiving your monthly allowance, before spending on cafes or outings.'
    ],
    studentCaseStudy: {
      studentName: 'Rahul (2nd Year B.Com)',
      scenario: 'Received ₹10,000 monthly allowance from parents on the 1st.',
      mistake: 'Spent ₹4,000 in the first week on dining out with friends, then had to ask for emergency loans when exam registration fees of ₹2,500 were announced in week 3.',
      smartSolution: 'Automate a mental "lockbox": Immediately ring-fence exam dues and mess charges on Day 1 in StudentFund.'
    },
    quiz: [
      {
        question: 'Under the student-adapted 60-25-15 rule, what does the 15% represent?',
        options: [
          'Budget for buying video games',
          'Emergency buffer and semester savings',
          'Interest on loans',
          'Canteen food budget'
        ],
        correctAnswerIndex: 1,
        explanation: '15% is kept as an emergency buffer and savings for irregular academic expenses.'
      },
      {
        question: 'When should essential college commitments like exam fees be accounted for?',
        options: [
          'Only after finishing weekend parties',
          'Immediately upon allowance receipt before discretionary spending',
          'At the very end of the semester',
          'Never'
        ],
        correctAnswerIndex: 1,
        explanation: 'Prioritizing essential commitments on Day 1 prevents academic registration locks and late fines.'
      }
    ]
  },
  {
    id: 'runway-mastery',
    title: 'Understanding Your "Money Runway" & Burn Rate',
    category: 'Cash Flow Management',
    readTime: '5 min read',
    description: 'Learn how tech startups calculate runway and how applying it to your student bank balance saves you from running broke.',
    keyTakeaway: 'Runway = Liquid Available Balance ÷ Daily Essential Burn Rate. Never let runway fall below days until your next stipend.',
    content: [
      'In startup finance, "Runway" measures how many days a company can operate before running out of cash. In college, your runway is how many days you can survive until your next allowance arrives.',
      'Your Daily Essential Burn Rate is what it actually costs you per day to eat, travel, and buy study materials.',
      'If your next allowance is 20 days away, but your runway is only 11 days, you have an immediate 9-day cash shortfall that requires cutting discretionary spending today.'
    ],
    studentCaseStudy: {
      studentName: 'Pooja (3rd Year B.Tech)',
      scenario: 'Had ₹6,000 in bank balance with 25 days until her research stipend.',
      mistake: 'Assumed ₹6,000 was plenty and spent ₹350/day on Swiggy and cafe lattes.',
      smartSolution: 'With StudentFund Runway calculation, she realized her safe daily spending limit was only ₹240/day. By capping discretionary treats, she reached stipend day with ₹800 surplus.'
    },
    quiz: [
      {
        question: 'How is Student Money Runway calculated?',
        options: [
          'Total scholarship divided by GPA',
          'Available liquid cash divided by daily essential burn rate',
          'Monthly allowance multiplied by 12',
          'Total loans minus hostel deposit'
        ],
        correctAnswerIndex: 1,
        explanation: 'Runway is your liquid available balance divided by your daily essential living cost.'
      }
    ]
  },
  {
    id: 'emergency-fund',
    title: 'Building a ₹5,000 - ₹10,000 Student Safety Net',
    category: 'Savings & Security',
    readTime: '3 min read',
    description: 'How to build your first student emergency cushion without needing a full-time job.',
    keyTakeaway: 'Micro-save ₹100 - ₹200 whenever you earn cash or skip an impulse purchase.',
    content: [
      'Unplanned emergencies in college are common: laptop charger stops working before exams, broken glasses, sudden bus ticket home for a family emergency.',
      'Having a dedicated ₹5,000 safety fund prevents panic borrowing from friends or using high-interest instant student loan apps.',
      'Ring-fence your emergency fund in a separate goal in StudentFund so you do not accidentally spend it during canteen hangouts.'
    ],
    studentCaseStudy: {
      studentName: 'Vikram (1st Year MBA)',
      scenario: 'Laptop motherboard fried 4 days before semester capstone submission.',
      mistake: 'Had zero emergency savings, had to borrow at high stress from peers.',
      smartSolution: 'Maintained a dedicated ₹8,000 Emergency Buffer goal that covered repairs instantly without academic delay.'
    },
    quiz: [
      {
        question: 'What is the main purpose of a student emergency buffer?',
        options: [
          'To buy festival clothes',
          'To cover unexpected urgent expenses without borrowing or default',
          'To invest in speculative crypto',
          'To pay for gaming subscriptions'
        ],
        correctAnswerIndex: 1,
        explanation: 'A safety buffer protects against sudden emergencies like hardware breakdowns, urgent travel, or medical needs.'
      }
    ]
  },
  {
    id: 'debt-traps',
    title: 'Avoiding Instant Loan Apps & Buy Now Pay Later Traps',
    category: 'Financial Protection',
    readTime: '4 min read',
    description: 'Why BNPL and predatory instant student lending apps are dangerous for students without regular salaries.',
    keyTakeaway: 'If you cannot afford it in cash today, BNPL simply borrows from your future mess and book allowance.',
    content: [
      'Predatory micro-lending apps often target college students with promises of instant ₹1,000 - ₹5,000 loans with zero paperwork.',
      'They charge astronomical hidden interest, processing fees, and aggressive penalty charges for late repayments.',
      'Use the StudentFund "Can I Afford It?" simulator instead of borrowing to buy wants.'
    ],
    studentCaseStudy: {
      studentName: 'Tanvi (Final Year BCA)',
      scenario: 'Used a BNPL app to buy designer shoes on a ₹3,000 EMI plan.',
      mistake: 'Forgot the repayment date, incurred a ₹750 late penalty that damaged her newly created credit score.',
      smartSolution: 'Simulated the purchase with StudentFund "Save First" feature, saving ₹750/week for 4 weeks before purchasing debt-free.'
    },
    quiz: [
      {
        question: 'Why can Buy Now Pay Later (BNPL) be especially risky for college students?',
        options: [
          'Because universities ban it',
          'Because students lack fixed salaries, and late fees quickly turn small purchases into debt traps',
          'Because banks do not accept UPI',
          'Because textbooks are free'
        ],
        correctAnswerIndex: 1,
        explanation: 'Without guaranteed recurring salary, missed BNPL installments attract exorbitant penalties and damage credit profiles.'
      }
    ]
  }
];

// GET all literacy modules with user progress
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const progressList = await prisma.literacyProgress.findMany({
      where: { userId }
    });

    const progressMap = new Map<string, { completed: boolean; quizScore: number }>();
    for (const p of progressList) {
      progressMap.set(p.moduleId, { completed: p.completed, quizScore: p.quizScore || 0 });
    }

    const modulesWithProgress = literacyModules.map(m => {
      const prog = progressMap.get(m.id) || { completed: false, quizScore: 0 };
      return {
        ...m,
        completed: prog.completed,
        quizScore: prog.quizScore
      };
    });

    const completedCount = modulesWithProgress.filter(m => m.completed).length;

    return res.json({
      modules: modulesWithProgress,
      stats: {
        totalModules: literacyModules.length,
        completedModules: completedCount,
        progressPercent: Math.round((completedCount / literacyModules.length) * 100)
      }
    });
  } catch (error) {
    console.error('Literacy error:', error);
    return res.status(500).json({ error: 'Failed to fetch literacy modules.' });
  }
});

// POST submit quiz for a module
const quizSubmitSchema = z.object({
  moduleId: z.string(),
  answers: z.array(z.number().int())
});

router.post('/submit-quiz', requireAuth, validateBody(quizSubmitSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { moduleId, answers } = req.body;

    const module = literacyModules.find(m => m.id === moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    let correctCount = 0;
    const review = module.quiz.map((q, idx) => {
      const isCorrect = answers[idx] === q.correctAnswerIndex;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        userAnswer: answers[idx],
        correctAnswer: q.correctAnswerIndex,
        isCorrect,
        explanation: q.explanation
      };
    });

    const scorePercent = Math.round((correctCount / module.quiz.length) * 100);
    const passed = scorePercent >= 60;

    await prisma.literacyProgress.upsert({
      where: {
        userId_moduleId: {
          userId,
          moduleId
        }
      },
      create: {
        userId,
        moduleId,
        completed: passed,
        quizScore: scorePercent,
        completedAt: passed ? new Date() : null
      },
      update: {
        completed: passed,
        quizScore: Math.max(scorePercent),
        completedAt: passed ? new Date() : undefined
      }
    });

    return res.json({
      moduleId,
      scorePercent,
      correctCount,
      totalQuestions: module.quiz.length,
      passed,
      review
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return res.status(500).json({ error: 'Failed to process quiz submission.' });
  }
});

export default router;
