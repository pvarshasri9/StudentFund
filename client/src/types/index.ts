export interface UserProfile {
  id: string;
  email: string;
  name: string;
  college?: string;
  course?: string;
  currentSemester?: number;
  monthlyAllowance?: number;
  currency: string;
  isDemo: boolean;
  settings?: {
    theme: 'dark' | 'light';
    runwayBufferDays: number;
    enableAlerts: boolean;
    budgetWarningThresh: number;
    currencySymbol: string;
  };
}

export interface IncomeItem {
  id: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  isExpected: boolean;
  receivedDate?: string;
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  isEssential: boolean;
  paymentMethod: string;
  notes?: string;
  commitmentId?: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  month: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  utilizationRate: number;
  warningStatus: 'NORMAL' | 'WARNING_80' | 'EXCEEDED';
  notes?: string;
}

export interface CollegeCommitmentItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  status: 'UNPAID' | 'PAID' | 'PARTIAL';
  paidAmount: number;
  expenseId?: string;
  notes?: string;
}

export interface SavingsGoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  isCompleted: boolean;
  notes?: string;
  progressPercent: number;
  remainingAmount: number;
  monthsRemaining: number;
  requiredMonthlySavings: number;
  contributions?: {
    id: string;
    amount: number;
    date: string;
    notes?: string;
  }[];
}

export interface RunwayForecastItem {
  day: number;
  date: string;
  projectedBalance: number;
  events: string[];
  isShortfall: boolean;
}

export interface RunwayAnalysis {
  currentBalance: number;
  totalReceivedIncome: number;
  totalExpenses: number;
  totalSavingsAllocated: number;
  unpaidCommitmentsTotal: number;
  dailyEssentialBurn: number;
  dailyTotalBurn: number;
  runwayDaysEssential: number;
  runwayDaysTotal: number;
  nextExpectedIncome: {
    amount: number;
    source: string;
    date: string;
    daysAway: number;
  } | null;
  hasShortfallBeforeNextIncome: boolean;
  shortfallAmount: number;
  suggestedDailyLimit: number;
  forecast: RunwayForecastItem[];
  assumptions: string[];
  status: 'HEALTHY' | 'MODERATE' | 'CRITICAL';
}

export interface AffordabilityResult {
  decision: 'AFFORDABLE' | 'STRETCH' | 'UNSAFE';
  itemTitle: string;
  price: number;
  category: string;
  currentBalance: number;
  projectedBalanceAfter: number;
  unpaidCommitments: number;
  monthlyBudgetRemaining: number;
  safetyReserve: number;
  scenarios: {
    buyNow: {
      feasible: boolean;
      impactSummary: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    delayDays: {
      recommendedDays: number;
      reason: string;
    };
    saveFirst: {
      weeklySavingsNeeded: number;
      targetWeeks: number;
      planDescription: string;
    };
  };
  reasons: string[];
  recommendation: string;
}

export interface SmartInsight {
  id: string;
  type: 'WARNING' | 'OPPORTUNITY' | 'ALERT' | 'ACHIEVEMENT';
  title: string;
  message: string;
  reason: string;
  suggestedAction: string;
  metric?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FinancialOverviewReport {
  availableBalance: number;
  totalReceivedIncome: number;
  totalExpenses: number;
  totalSavings: number;
  unpaidCommitments: number;
  netSavingsRate: number;
  essentialExpensesRatio: number;
  topExpenseCategories: { category: string; amount: number; percentage: number }[];
  monthlyTrends: { month: string; income: number; expenses: number; savings: number; netFlow: number }[];
  activeBudgetCount: number;
  overBudgetCount: number;
  nearBudgetCount: number;
  collegeCommitmentSummary: {
    total: number;
    paid: number;
    unpaid: number;
    upcomingCount: number;
  };
}

export interface ReminderItem {
  id: string;
  title: string;
  dueDate: string;
  category: string;
  amount?: number;
  isCompleted: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export interface LiteracyModule {
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
  completed: boolean;
  quizScore: number;
}

export interface AuthoritativeFinancialSummary {
  userId: string;
  totalReceivedIncome: number;
  totalExpectedIncome: number;
  totalLifetimeIncome: number;
  totalExpenses: number;
  totalEssentialExpenses: number;
  totalDiscretionaryExpenses: number;
  totalSavingsAllocated: number;
  currentLiquidBalance: number;
  unpaidCommitmentsTotal: number;
  paidCommitmentsTotal: number;
  totalCommitmentsAmount: number;
  trueDisposableBalance: number;
  collegeCommitmentSummary: {
    total: number;
    paid: number;
    unpaid: number;
    upcoming14DaysCount: number;
    upcoming14DaysAmount: number;
    overdueCount: number;
    overdueAmount: number;
  };
  dailyEssentialBurn: number;
  dailyTotalBurn: number;
  runwayDaysEssential: number;
  runwayDaysTotal: number;
  timestamp: string;
}
