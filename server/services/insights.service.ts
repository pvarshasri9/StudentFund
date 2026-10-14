import { prisma } from '../prisma.js';
import { calculateRunway } from './runway.service.js';

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

export async function generateSmartInsights(userId: string): Promise<SmartInsight[]> {
  const insights: SmartInsight[] = [];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [incomes, expenses, budgets, commitments, savingsGoals, runway] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId, month: currentMonth } }),
    prisma.collegeCommitment.findMany({ where: { userId, status: { not: 'PAID' } } }),
    prisma.savingsGoal.findMany({ where: { userId } }),
    calculateRunway(userId, 30)
  ]);

  // 1. Runway Critical or Shortfall Insight
  if (runway.hasShortfallBeforeNextIncome) {
    insights.push({
      id: 'ins-runway-shortfall',
      type: 'WARNING',
      title: 'Runway Shortfall Warning',
      message: `Your current burn rate will exhaust liquid funds ${runway.runwayDaysEssential} days before your next expected income.`,
      reason: `Calculated from your current balance ₹${runway.currentBalance.toLocaleString('en-IN')} and daily burn rate ₹${runway.dailyEssentialBurn}/day.`,
      suggestedAction: `Cap non-essential spending immediately. Target daily spending under ₹${runway.suggestedDailyLimit}/day to bridge the gap.`,
      metric: `${runway.runwayDaysEssential} Days Left`,
      priority: 'HIGH'
    });
  } else if (runway.runwayDaysEssential < 15) {
    insights.push({
      id: 'ins-runway-low',
      type: 'ALERT',
      title: 'Lean Runway Alert',
      message: `You have approximately ${runway.runwayDaysEssential} days of essential runway remaining.`,
      reason: `At your current burn rate of ₹${runway.dailyEssentialBurn}/day, your funds will last until ${new Date(now.getTime() + runway.runwayDaysEssential * 86400000).toLocaleDateString('en-IN')}.`,
      suggestedAction: `Check if you have pending freelance stipends or request parental allowance advance if needed.`,
      metric: `${runway.runwayDaysEssential} Days`,
      priority: 'MEDIUM'
    });
  }

  // 2. College Fee / Commitment Deadline Risk
  const upcomingHighRiskFees = commitments.filter(c => {
    const due = new Date(c.dueDate);
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    return daysUntil <= 14 && daysUntil >= 0;
  });

  if (upcomingHighRiskFees.length > 0) {
    const totalDue = upcomingHighRiskFees.reduce((s, c) => s + (c.amount - c.paidAmount), 0);
    insights.push({
      id: 'ins-fees-due',
      type: 'WARNING',
      title: 'College Commitments Due Soon',
      message: `${upcomingHighRiskFees.length} academic obligation(s) totaling ₹${totalDue.toLocaleString('en-IN')} are due within the next 14 days.`,
      reason: `Obligations include: ${upcomingHighRiskFees.map(c => `${c.title} (₹${c.amount - c.paidAmount})`).join(', ')}.`,
      suggestedAction: `Ring-fence ₹${totalDue.toLocaleString('en-IN')} in your account to avoid late fines or semester registration locks.`,
      metric: `₹${totalDue.toLocaleString('en-IN')}`,
      priority: 'HIGH'
    });
  }

  // 3. Budget Utilization Insights (80% warning or exceeded)
  for (const b of budgets) {
    const spent = expenses
      .filter(e => {
        const d = new Date(e.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return m === currentMonth && (b.category === 'OVERALL' || e.category === b.category);
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const usagePercent = Math.round((spent / b.limitAmount) * 100);

    if (usagePercent >= 100) {
      insights.push({
        id: `ins-budget-over-${b.id}`,
        type: 'WARNING',
        title: `Budget Exceeded: ${b.category}`,
        message: `You have spent ₹${spent.toLocaleString('en-IN')} out of your ₹${b.limitAmount.toLocaleString('en-IN')} limit (${usagePercent}%).`,
        reason: `Spending has crossed the set monthly allocation for ${b.category}.`,
        suggestedAction: `Freeze further discretionary spending in this category for the remainder of ${currentMonth}.`,
        metric: `${usagePercent}% Utilized`,
        priority: 'HIGH'
      });
    } else if (usagePercent >= 80) {
      insights.push({
        id: `ins-budget-warn-${b.id}`,
        type: 'ALERT',
        title: `Approaching Budget Limit: ${b.category}`,
        message: `You have consumed ${usagePercent}% of your ₹${b.limitAmount.toLocaleString('en-IN')} budget with days remaining in the month.`,
        reason: `Only ₹${(b.limitAmount - spent).toLocaleString('en-IN')} remains in your ${b.category} allocation.`,
        suggestedAction: `Pace your remaining days by spending at most ₹${Math.max(10, Math.floor((b.limitAmount - spent) / 10))}/day in this category.`,
        metric: `${usagePercent}% Utilized`,
        priority: 'MEDIUM'
      });
    }
  }

  // 4. Discretionary Spending Ratio
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonth;
  });

  const totalSpentMonth = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const nonEssentialSpent = currentMonthExpenses
    .filter(e => !e.isEssential)
    .reduce((s, e) => s + e.amount, 0);

  if (totalSpentMonth > 0) {
    const nonEssentialRatio = Math.round((nonEssentialSpent / totalSpentMonth) * 100);
    if (nonEssentialRatio > 40) {
      insights.push({
        id: 'ins-discretionary-high',
        type: 'OPPORTUNITY',
        title: 'High Discretionary Spending Detected',
        message: `${nonEssentialRatio}% of your expenditures this month are categorized as non-essential (eating out, entertainment, impulse buys).`,
        reason: `₹${nonEssentialSpent.toLocaleString('en-IN')} out of ₹${totalSpentMonth.toLocaleString('en-IN')} went to non-essential items.`,
        suggestedAction: `Trimming non-essentials by just 15% could redirect ₹${Math.round(nonEssentialSpent * 0.15).toLocaleString('en-IN')} toward your savings goals.`,
        metric: `${nonEssentialRatio}% Non-Essential`,
        priority: 'MEDIUM'
      });
    }
  }

  // 5. Savings Goals Milestone
  const activeSavings = savingsGoals.filter(g => !g.isCompleted);
  for (const goal of activeSavings) {
    const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
    if (pct >= 80) {
      insights.push({
        id: `ins-savings-near-${goal.id}`,
        type: 'ACHIEVEMENT',
        title: `Goal Almost Reached: ${goal.title}`,
        message: `You are at ${pct}% of your ₹${goal.targetAmount.toLocaleString('en-IN')} target!`,
        reason: `Only ₹${(goal.targetAmount - goal.currentAmount).toLocaleString('en-IN')} left to fully fund this goal.`,
        suggestedAction: `Make a final micro-contribution to complete this milestone!`,
        metric: `${pct}% Complete`,
        priority: 'LOW'
      });
    }
  }

  // If no critical alerts, add an encouraging financial health insight
  if (insights.length === 0) {
    insights.push({
      id: 'ins-healthy-flow',
      type: 'ACHIEVEMENT',
      title: 'Strong Financial Equilibrium',
      message: 'Your money runway is well-balanced, college commitments are on track, and all category budgets are within safe thresholds.',
      reason: 'Expenses are pacing within monthly income, with no urgent payment defaults detected.',
      suggestedAction: 'Consider allocating any surplus cash to your Emergency Fund or Semester Buffer savings goal.',
      metric: 'Stable',
      priority: 'LOW'
    });
  }

  return insights;
}
