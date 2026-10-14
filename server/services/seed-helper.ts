import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';

export async function seedStudentDemoData(demoEmail = 'demo.student@yukti.in', forceClean = false) {
  if (forceClean) {
    const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (existing) {
      await prisma.user.delete({ where: { id: existing.id } });
    }
  }

  const hashedPassword = await bcrypt.hash('StudentFund2025!', 10);
  const now = new Date();

  // Create or retrieve Demo User
  let user = await prisma.user.findUnique({
    where: { email: demoEmail },
    include: { settings: true }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: demoEmail,
        password: hashedPassword,
        name: 'Ananya Sharma',
        college: 'Indian Institute of Technology (IIT) Delhi',
        course: 'B.Tech Computer Science & Engineering',
        currentSemester: 4,
        monthlyAllowance: 15000,
        currency: 'INR',
        isDemo: true,
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
  }

  // Clear existing items if re-seeding
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.income.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.collegeCommitment.deleteMany({ where: { userId: user.id } });
  await prisma.savingsGoal.deleteMany({ where: { userId: user.id } });
  await prisma.reminder.deleteMany({ where: { userId: user.id } });
  await prisma.literacyProgress.deleteMany({ where: { userId: user.id } });

  // 1. Incomes: Received vs Expected
  const dayAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };
  const dayForward = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  await prisma.income.createMany({
    data: [
      {
        userId: user.id,
        amount: 25000,
        source: 'Allowance',
        description: 'Semester Opening Family Allowance (Parents)',
        date: dayAgo(24),
        isExpected: false,
        receivedDate: dayAgo(24),
        notes: 'Transferred via UPI into HDFC student savings account'
      },
      {
        userId: user.id,
        amount: 15000,
        source: 'Allowance',
        description: 'Monthly Living Allowance (October)',
        date: dayAgo(10),
        isExpected: false,
        receivedDate: dayAgo(10),
        notes: 'Direct parental support for mess & books'
      },
      {
        userId: user.id,
        amount: 12000,
        source: 'Stipend',
        description: 'Undergrad Research Assistantship Stipend',
        date: dayAgo(5),
        isExpected: false,
        receivedDate: dayAgo(5),
        notes: 'Lab grant credit from Dean Academics office'
      },
      {
        userId: user.id,
        amount: 5000,
        source: 'Scholarship',
        description: 'State Merit Scholarship (Semester Installment)',
        date: dayAgo(18),
        isExpected: false,
        receivedDate: dayAgo(18),
        notes: 'National Scholarship Portal remittance'
      },
      {
        userId: user.id,
        amount: 15000,
        source: 'Allowance',
        description: 'Next Month Family Allowance',
        date: dayForward(20),
        isExpected: true,
        notes: 'Expected around 1st of next month'
      },
      {
        userId: user.id,
        amount: 12000,
        source: 'Stipend',
        description: 'November Research Assistantship Stipend',
        date: dayForward(25),
        isExpected: true,
        notes: 'Subject to timesheet sign-off by Faculty Advisor'
      }
    ]
  });

  // 2. Expenses (Realistic student spending)
  await prisma.expense.createMany({
    data: [
      {
        userId: user.id,
        amount: 4800,
        category: 'Food/Mess',
        description: 'Hostel Mess Monthly Rebate & Dining Hall Advance',
        date: dayAgo(22),
        isEssential: true,
        paymentMethod: 'UPI',
        notes: 'Compulsory mess charges'
      },
      {
        userId: user.id,
        amount: 1250,
        category: 'Academic/Books',
        description: 'Algorithms Design & Operating Systems reference books',
        date: dayAgo(20),
        isEssential: true,
        paymentMethod: 'UPI',
        notes: 'Purchased from campus co-op store'
      },
      {
        userId: user.id,
        amount: 650,
        category: 'Transport',
        description: 'Delhi Metro SmartCard monthly recharge',
        date: dayAgo(18),
        isEssential: true,
        paymentMethod: 'UPI',
        notes: 'Commute between Hauz Khas and library'
      },
      {
        userId: user.id,
        amount: 1100,
        category: 'Food/Mess',
        description: 'Campus Canteen & Night Mess snacks with study group',
        date: dayAgo(15),
        isEssential: false,
        paymentMethod: 'UPI',
        notes: 'Tea, maggi, and mid-sem study prep snacks'
      },
      {
        userId: user.id,
        amount: 499,
        category: 'Utilities',
        description: 'Airtel 5G Unlimited Student Data & JioFiber hostel share',
        date: dayAgo(12),
        isEssential: true,
        paymentMethod: 'UPI'
      },
      {
        userId: user.id,
        amount: 850,
        category: 'Entertainment',
        description: 'Weekend Movie & College cultural fest merchandise',
        date: dayAgo(8),
        isEssential: false,
        paymentMethod: 'UPI'
      },
      {
        userId: user.id,
        amount: 1450,
        category: 'Food/Mess',
        description: 'Swiggy dinner after hackathon deadline',
        date: dayAgo(3),
        isEssential: false,
        paymentMethod: 'UPI'
      },
      {
        userId: user.id,
        amount: 500,
        category: 'Personal',
        description: 'Laundry service & room cleaning supplies',
        date: dayAgo(2),
        isEssential: true,
        paymentMethod: 'Cash'
      }
    ]
  });

  // 3. Budgets for current month
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        category: 'OVERALL',
        month: currentMonthStr,
        limitAmount: 16000,
        notes: 'Monthly total discretionary & living ceiling'
      },
      {
        userId: user.id,
        category: 'Food/Mess',
        month: currentMonthStr,
        limitAmount: 6500,
        notes: 'Mess hall dues and night canteen cap'
      },
      {
        userId: user.id,
        category: 'Entertainment',
        month: currentMonthStr,
        limitAmount: 1500,
        notes: 'Outings, movies, and cafe meetups'
      },
      {
        userId: user.id,
        category: 'Academic/Books',
        month: currentMonthStr,
        limitAmount: 2500,
        notes: 'Study resources and lab manuals'
      }
    ]
  });

  // 4. College Expense Commitments (College Priority Planner)
  await prisma.collegeCommitment.createMany({
    data: [
      {
        userId: user.id,
        title: 'Semester 5 Tuition & Academic Fee',
        amount: 32000,
        dueDate: dayForward(18),
        priority: 'HIGH',
        category: 'Tuition',
        status: 'UNPAID',
        paidAmount: 0,
        notes: 'Strict deadline; late fine ₹500/week after due date'
      },
      {
        userId: user.id,
        title: 'Hostel Maintenance & Mess Caution Deposit',
        amount: 8500,
        dueDate: dayForward(12),
        priority: 'HIGH',
        category: 'Hostel',
        status: 'PARTIAL',
        paidAmount: 3500,
        notes: 'Partial payment of ₹3,500 cleared, balance ₹5,000 remaining'
      },
      {
        userId: user.id,
        title: 'End-Semester Exam Registration & Lab Fee',
        amount: 2200,
        dueDate: dayForward(35),
        priority: 'MEDIUM',
        category: 'ExamFee',
        status: 'UNPAID',
        paidAmount: 0,
        notes: 'Academic Portal registration for 6 theory + 2 lab courses'
      },
      {
        userId: user.id,
        title: 'ACM & IEEE Student Branch Membership',
        amount: 1400,
        dueDate: dayForward(45),
        priority: 'LOW',
        category: 'Subscription',
        status: 'UNPAID',
        paidAmount: 0,
        notes: 'Optional professional society renewal'
      }
    ]
  });

  // 5. Savings Goals
  const laptopGoal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      title: 'MacBook Air / High-Performance Dev Laptop',
      targetAmount: 65000,
      currentAmount: 18000,
      targetDate: dayForward(120),
      category: 'LAPTOP',
      isCompleted: false,
      notes: 'For ML model training and final year capstone project'
    }
  });

  const emergencyGoal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      title: 'Student Emergency Buffer Fund',
      targetAmount: 10000,
      currentAmount: 6500,
      targetDate: dayForward(60),
      category: 'EMERGENCY',
      isCompleted: false,
      notes: 'Emergency reserve for urgent medical needs or travel home'
    }
  });

  // Savings contributions logs
  await prisma.savingsContribution.createMany({
    data: [
      {
        goalId: laptopGoal.id,
        userId: user.id,
        amount: 10000,
        date: dayAgo(24),
        notes: 'Initial seed allocation from semester grant'
      },
      {
        goalId: laptopGoal.id,
        userId: user.id,
        amount: 8000,
        date: dayAgo(10),
        notes: 'Monthly savings contribution from RA stipend'
      },
      {
        goalId: emergencyGoal.id,
        userId: user.id,
        amount: 6500,
        date: dayAgo(15),
        notes: 'Safety net allocation'
      }
    ]
  });

  // 6. Reminders
  await prisma.reminder.createMany({
    data: [
      {
        userId: user.id,
        title: 'Clear Hostel Mess Balance (₹5,000 remaining)',
        dueDate: dayForward(12),
        category: 'HOSTEL_RENT',
        amount: 5000,
        priority: 'HIGH',
        notes: 'Pay at Hall of Residence office before room inspection'
      },
      {
        userId: user.id,
        title: 'Pay Semester 5 Tuition Fee (₹32,000)',
        dueDate: dayForward(18),
        category: 'COLLEGE_FEE',
        amount: 32000,
        priority: 'HIGH',
        notes: 'Online SBI Collect Portal fee submission'
      },
      {
        userId: user.id,
        title: 'Expected Next Month Allowance Deposit',
        dueDate: dayForward(20),
        category: 'ALLOWANCE',
        amount: 15000,
        priority: 'HIGH',
        notes: 'Verify bank SMS for family transfer'
      },
      {
        userId: user.id,
        title: 'Allocate ₹2,500 to Laptop Savings Goal',
        dueDate: dayForward(22),
        category: 'SAVINGS',
        amount: 2500,
        priority: 'MEDIUM',
        notes: 'Recurring micro-savings target'
      }
    ]
  });

  // 7. Financial Literacy modules progress
  await prisma.literacyProgress.createMany({
    data: [
      {
        userId: user.id,
        moduleId: 'budgeting-101',
        completed: true,
        quizScore: 100,
        completedAt: dayAgo(10)
      },
      {
        userId: user.id,
        moduleId: 'runway-mastery',
        completed: true,
        quizScore: 85,
        completedAt: dayAgo(4)
      },
      {
        userId: user.id,
        moduleId: 'emergency-fund',
        completed: false,
        quizScore: 0
      }
    ]
  });

  return user;
}
