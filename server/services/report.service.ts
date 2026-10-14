import { prisma } from '../prisma.js';
import { getAuthoritativeFinancialSummary } from './financial-calculator.service.js';

export interface FinancialOverviewReport {
  availableBalance: number;
  totalReceivedIncome: number;
  totalExpenses: number;
  totalSavings: number;
  unpaidCommitments: number;
  netSavingsRate: number; // percentage
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

export async function generateOverviewReport(userId: string, startDate?: Date, endDate?: Date): Promise<FinancialOverviewReport> {
  const authoritative = await getAuthoritativeFinancialSummary(userId);

  const dateFilter: any = {};
  if (startDate) dateFilter.gte = startDate;
  if (endDate) dateFilter.lte = endDate;

  const hasDateFilter = Object.keys(dateFilter).length > 0;
  const whereDate = hasDateFilter ? { date: dateFilter } : {};

  const [incomes, expenses, budgets] = await Promise.all([
    prisma.income.findMany({ where: { userId, ...whereDate } }),
    prisma.expense.findMany({ where: { userId, ...whereDate } }),
    prisma.budget.findMany({ where: { userId } })
  ]);

  const periodReceivedIncome = incomes
    .filter(i => !i.isExpected)
    .reduce((s, i) => s + i.amount, 0);

  const periodExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const displayReceivedIncome = hasDateFilter ? periodReceivedIncome : authoritative.totalReceivedIncome;
  const displayExpenses = hasDateFilter ? periodExpenses : authoritative.totalExpenses;

  const netSavingsRate = displayReceivedIncome > 0
    ? Math.round(((displayReceivedIncome - displayExpenses) / displayReceivedIncome) * 100)
    : 0;

  const essentialExpenseTotal = expenses
    .filter(e => e.isEssential)
    .reduce((s, e) => s + e.amount, 0);

  const essentialExpensesRatio = displayExpenses > 0
    ? Math.round((essentialExpenseTotal / displayExpenses) * 100)
    : 0;

  // Category breakdown
  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + exp.amount);
  }

  const topExpenseCategories = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: displayExpenses > 0 ? Math.round((amount / displayExpenses) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly trends (group by YYYY-MM)
  const monthMap = new Map<string, { income: number; expenses: number; savings: number }>();

  const getMonthEntry = (m: string) => {
    if (!monthMap.has(m)) {
      monthMap.set(m, { income: 0, expenses: 0, savings: 0 });
    }
    return monthMap.get(m)!;
  };

  for (const inc of incomes) {
    if (!inc.isExpected) {
      const m = new Date(inc.date).toISOString().slice(0, 7);
      getMonthEntry(m).income += inc.amount;
    }
  }

  for (const exp of expenses) {
    const m = new Date(exp.date).toISOString().slice(0, 7);
    getMonthEntry(m).expenses += exp.amount;
  }

  const monthlyTrends = Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      savings: data.savings,
      netFlow: data.income - data.expenses
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Budget stats
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentBudgets = budgets.filter(b => b.month === currentMonthStr);

  let overBudgetCount = 0;
  let nearBudgetCount = 0;

  for (const b of currentBudgets) {
    const spent = expenses
      .filter(e => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonthStr &&
          (b.category === 'OVERALL' || e.category === b.category);
      })
      .reduce((s, e) => s + e.amount, 0);

    const ratio = spent / b.limitAmount;
    if (ratio >= 1.0) overBudgetCount++;
    else if (ratio >= 0.8) nearBudgetCount++;
  }

  return {
    availableBalance: authoritative.currentLiquidBalance,
    totalReceivedIncome: displayReceivedIncome,
    totalExpenses: displayExpenses,
    totalSavings: authoritative.totalSavingsAllocated,
    unpaidCommitments: authoritative.unpaidCommitmentsTotal,
    netSavingsRate,
    essentialExpensesRatio,
    topExpenseCategories,
    monthlyTrends,
    activeBudgetCount: currentBudgets.length,
    overBudgetCount,
    nearBudgetCount,
    collegeCommitmentSummary: {
      total: authoritative.collegeCommitmentSummary.total,
      paid: authoritative.collegeCommitmentSummary.paid,
      unpaid: authoritative.collegeCommitmentSummary.unpaid,
      upcomingCount: authoritative.collegeCommitmentSummary.upcoming14DaysCount
    }
  };
}

export async function exportTransactionsCsv(userId: string): Promise<string> {
  const [incomes, expenses, commitments] = await Promise.all([
    prisma.income.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.collegeCommitment.findMany({ where: { userId }, orderBy: { dueDate: 'desc' } })
  ]);

  const rows: string[] = [
    'Type,Category/Source,Description,Amount (INR),Date,Status/Essential,Notes'
  ];

  for (const inc of incomes) {
    rows.push(
      `"INCOME","${inc.source}","${inc.description.replace(/"/g, '""')}",${inc.amount},"${inc.date.toISOString().slice(0, 10)}","${inc.isExpected ? 'Expected' : 'Received'}","${(inc.notes || '').replace(/"/g, '""')}"`
    );
  }

  for (const exp of expenses) {
    rows.push(
      `"EXPENSE","${exp.category}","${exp.description.replace(/"/g, '""')}",${exp.amount},"${exp.date.toISOString().slice(0, 10)}","${exp.isEssential ? 'Essential' : 'Discretionary'}","${(exp.notes || '').replace(/"/g, '""')}"`
    );
  }

  for (const comm of commitments) {
    rows.push(
      `"COLLEGE_COMMITMENT","${comm.category}","${comm.title.replace(/"/g, '""')}",${comm.amount},"${comm.dueDate.toISOString().slice(0, 10)}","${comm.status}","Paid: ${comm.paidAmount}"`
    );
  }

  return rows.join('\n');
}
