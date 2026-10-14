import { prisma } from '../prisma.js';

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

/**
 * Authoritative shared calculation service for StudentFund.
 * 
 * Documented Accounting Formulas:
 * 1. Total Received Income = sum of all Income entries where isExpected === false.
 * 2. Total Expected Income = sum of all Income entries where isExpected === true (future inflow, not in current cash).
 * 3. Total Expenses = sum of all confirmed Expense entries.
 * 4. Total Savings Allocated = sum of currentAmount across all active/completed SavingsGoal entries (ring-fenced).
 * 5. Current Liquid Balance (Available Cash in Bank/Hand):
 *      Current Liquid Balance = max(0, Total Received Income - Total Expenses - Total Savings Allocated)
 * 6. Unpaid College Commitments = sum of (amount - paidAmount) for all commitments where status !== 'PAID'.
 * 7. True Disposable Balance (Free cash after reserving for 100% of upcoming college dues):
 *      True Disposable Balance = max(0, Current Liquid Balance - Unpaid College Commitments)
 * 8. Runway Days:
 *      Runway Days = Current Liquid Balance / Daily Essential Living Burn
 */
export async function getAuthoritativeFinancialSummary(userId: string): Promise<AuthoritativeFinancialSummary> {
  const now = new Date();

  const [incomes, expenses, savingsGoals, commitments] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.savingsGoal.findMany({ where: { userId } }),
    prisma.collegeCommitment.findMany({ where: { userId } })
  ]);

  // 1. Incomes
  const totalReceivedIncome = incomes
    .filter(i => !i.isExpected)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpectedIncome = incomes
    .filter(i => i.isExpected)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalLifetimeIncome = totalReceivedIncome + totalExpectedIncome;

  // 2. Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totalEssentialExpenses = expenses
    .filter(e => e.isEssential)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDiscretionaryExpenses = totalExpenses - totalEssentialExpenses;

  // 3. Savings allocations
  const totalSavingsAllocated = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  // 4. Current Liquid Balance
  const currentLiquidBalance = Math.max(0, totalReceivedIncome - totalExpenses - totalSavingsAllocated);

  // 5. College Commitments
  const totalCommitmentsAmount = commitments.reduce((sum, c) => sum + c.amount, 0);
  const paidCommitmentsTotal = commitments.reduce((sum, c) => sum + c.paidAmount, 0);
  const unpaidCommitmentsTotal = Math.max(0, totalCommitmentsAmount - paidCommitmentsTotal);

  // True Disposable Balance
  const trueDisposableBalance = Math.max(0, currentLiquidBalance - unpaidCommitmentsTotal);

  // Commitment upcoming & overdue analysis
  const upcomingLimit = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcoming14Days = commitments.filter(c => {
    if (c.status === 'PAID') return false;
    const due = new Date(c.dueDate);
    return due >= now && due <= upcomingLimit;
  });
  const upcoming14DaysCount = upcoming14Days.length;
  const upcoming14DaysAmount = upcoming14Days.reduce((sum, c) => sum + (c.amount - c.paidAmount), 0);

  const overdue = commitments.filter(c => {
    if (c.status === 'PAID') return false;
    const due = new Date(c.dueDate);
    return due < now;
  });
  const overdueCount = overdue.length;
  const overdueAmount = overdue.reduce((sum, c) => sum + (c.amount - c.paidAmount), 0);

  // 6. Daily Burn Rate based on past 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const past30Expenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
  const past30Essential = past30Expenses
    .filter(e => e.isEssential)
    .reduce((sum, e) => sum + e.amount, 0);
  const past30Total = past30Expenses.reduce((sum, e) => sum + e.amount, 0);

  const dailyEssentialBurn = past30Essential > 0 ? Math.round(past30Essential / 30) : 250;
  const dailyTotalBurn = past30Total > 0 ? Math.round(past30Total / 30) : Math.round(dailyEssentialBurn * 1.3);

  const runwayDaysEssential = dailyEssentialBurn > 0 ? Math.floor(currentLiquidBalance / dailyEssentialBurn) : 999;
  const runwayDaysTotal = dailyTotalBurn > 0 ? Math.floor(currentLiquidBalance / dailyTotalBurn) : 999;

  return {
    userId,
    totalReceivedIncome: Math.round(totalReceivedIncome),
    totalExpectedIncome: Math.round(totalExpectedIncome),
    totalLifetimeIncome: Math.round(totalLifetimeIncome),
    totalExpenses: Math.round(totalExpenses),
    totalEssentialExpenses: Math.round(totalEssentialExpenses),
    totalDiscretionaryExpenses: Math.round(totalDiscretionaryExpenses),
    totalSavingsAllocated: Math.round(totalSavingsAllocated),
    currentLiquidBalance: Math.round(currentLiquidBalance),
    unpaidCommitmentsTotal: Math.round(unpaidCommitmentsTotal),
    paidCommitmentsTotal: Math.round(paidCommitmentsTotal),
    totalCommitmentsAmount: Math.round(totalCommitmentsAmount),
    trueDisposableBalance: Math.round(trueDisposableBalance),
    collegeCommitmentSummary: {
      total: Math.round(totalCommitmentsAmount),
      paid: Math.round(paidCommitmentsTotal),
      unpaid: Math.round(unpaidCommitmentsTotal),
      upcoming14DaysCount,
      upcoming14DaysAmount: Math.round(upcoming14DaysAmount),
      overdueCount,
      overdueAmount: Math.round(overdueAmount)
    },
    dailyEssentialBurn,
    dailyTotalBurn,
    runwayDaysEssential,
    runwayDaysTotal,
    timestamp: new Date().toISOString()
  };
}
