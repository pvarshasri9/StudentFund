import { prisma } from '../prisma.js';
import { getAuthoritativeFinancialSummary } from './financial-calculator.service.js';

export interface AffordabilityInput {
  itemTitle: string;
  price: number;
  category: string;
  urgency: 'WANT' | 'NEED';
  targetDate?: string;
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
  safetyReserve: number; // Ring-fenced minimum cash
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

export async function checkAffordability(
  userId: string,
  input: AffordabilityInput
): Promise<AffordabilityResult> {
  const [summary, expenses, commitments, budgets] = await Promise.all([
    getAuthoritativeFinancialSummary(userId),
    prisma.expense.findMany({ where: { userId } }),
    prisma.collegeCommitment.findMany({ where: { userId, status: { not: 'PAID' } } }),
    prisma.budget.findMany({ where: { userId } })
  ]);

  // Current authoritative liquid cash available
  const currentBalance = summary.currentLiquidBalance;

  // Unpaid commitments due in the next 30 days
  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);

  const upcomingCommitments = commitments.filter(c => new Date(c.dueDate) <= next30Days);
  const totalUpcomingCommitments = upcomingCommitments.reduce((sum, c) => sum + (c.amount - c.paidAmount), 0);

  // Minimum safety cushion (₹1,500 for emergency college travel/medical buffer)
  const safetyReserve = 1500;

  // Monthly budget check for this category or overall
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const categoryBudget = budgets.find(b => b.month === currentMonth && (b.category === input.category || b.category === 'OVERALL'));

  let monthlyBudgetRemaining = 999999;
  if (categoryBudget) {
    const categorySpent = expenses
      .filter(e => {
        const d = new Date(e.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return m === currentMonth && (categoryBudget.category === 'OVERALL' || e.category === input.category);
      })
      .reduce((sum, e) => sum + e.amount, 0);
    monthlyBudgetRemaining = Math.max(0, categoryBudget.limitAmount - categorySpent);
  }

  // Projected balance after purchase
  const projectedBalanceAfter = currentBalance - input.price;

  // Real liquid cash free after ring-fencing upcoming fees and emergency buffer
  const trueDisposableCash = currentBalance - totalUpcomingCommitments - safetyReserve;

  const reasons: string[] = [];
  let decision: 'AFFORDABLE' | 'STRETCH' | 'UNSAFE' = 'AFFORDABLE';

  if (input.price > currentBalance) {
    decision = 'UNSAFE';
    reasons.push(`Purchase price (₹${input.price.toLocaleString('en-IN')}) exceeds total available bank balance (₹${currentBalance.toLocaleString('en-IN')}).`);
  } else if (input.price > trueDisposableCash) {
    if (projectedBalanceAfter < totalUpcomingCommitments) {
      decision = 'UNSAFE';
      reasons.push(`Buying this leaves only ₹${projectedBalanceAfter.toLocaleString('en-IN')}, which will cause you to default on ₹${totalUpcomingCommitments.toLocaleString('en-IN')} in upcoming college fee/hostel commitments.`);
    } else {
      decision = 'STRETCH';
      reasons.push(`Buying now cuts into your emergency safety buffer of ₹${safetyReserve.toLocaleString('en-IN')}.`);
    }
  }

  if (categoryBudget && input.price > monthlyBudgetRemaining) {
    reasons.push(`This purchase exceeds your remaining ${categoryBudget.category} budget of ₹${monthlyBudgetRemaining.toLocaleString('en-IN')}.`);
    if (decision === 'AFFORDABLE') decision = 'STRETCH';
  }

  if (decision === 'AFFORDABLE') {
    reasons.push(`Your liquid balance (₹${currentBalance.toLocaleString('en-IN')}) easily covers this purchase while reserving ₹${totalUpcomingCommitments.toLocaleString('en-IN')} for college dues.`);
    reasons.push(`Projected remaining balance of ₹${projectedBalanceAfter.toLocaleString('en-IN')} remains above your ₹${safetyReserve.toLocaleString('en-IN')} reserve.`);
  }

  // Savings scenario
  const targetWeeks = Math.max(2, Math.ceil(input.price / 800));
  const weeklySavingsNeeded = Math.ceil(input.price / targetWeeks);

  // Recommendations text
  let recommendation = '';
  if (decision === 'AFFORDABLE') {
    recommendation = `Safe to purchase! You have adequate cash cushions for college fees and emergencies.`;
  } else if (decision === 'STRETCH') {
    recommendation = `Proceed with caution. Consider delaying until your next monthly allowance arrives or save ₹${weeklySavingsNeeded}/week for ${targetWeeks} weeks.`;
  } else {
    recommendation = `Do not purchase right now. Prioritize your ₹${totalUpcomingCommitments.toLocaleString('en-IN')} college commitments first to prevent penalties or academic holds.`;
  }

  return {
    decision,
    itemTitle: input.itemTitle,
    price: input.price,
    category: input.category,
    currentBalance,
    projectedBalanceAfter,
    unpaidCommitments: totalUpcomingCommitments,
    monthlyBudgetRemaining: monthlyBudgetRemaining === 999999 ? 0 : monthlyBudgetRemaining,
    safetyReserve,
    scenarios: {
      buyNow: {
        feasible: input.price <= currentBalance,
        impactSummary: `Balance drops from ₹${currentBalance.toLocaleString('en-IN')} to ₹${projectedBalanceAfter.toLocaleString('en-IN')}`,
        riskLevel: decision === 'UNSAFE' ? 'HIGH' : decision === 'STRETCH' ? 'MEDIUM' : 'LOW'
      },
      delayDays: {
        recommendedDays: 14,
        reason: 'Allows your next expected stipend or allowance cycle to replenish available liquidity.'
      },
      saveFirst: {
        weeklySavingsNeeded,
        targetWeeks,
        planDescription: `Set aside ₹${weeklySavingsNeeded.toLocaleString('en-IN')}/week for ${targetWeeks} weeks to purchase guilt-free without touching college fee reserves.`
      }
    },
    reasons,
    recommendation
  };
}
