import { prisma } from '../prisma.js';
import { getAuthoritativeFinancialSummary } from './financial-calculator.service.js';

export interface RunwayForecastItem {
  day: number;
  date: string;
  projectedBalance: number;
  events: string[];
  isShortfall: boolean;
}

export interface RunwayAnalysisResult {
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

export async function calculateRunway(userId: string, forecastDays = 60): Promise<RunwayAnalysisResult> {
  const now = new Date();

  // Fetch authoritative snapshot and forward-looking schedules
  const [summary, futureIncomes, commitments] = await Promise.all([
    getAuthoritativeFinancialSummary(userId),
    prisma.income.findMany({
      where: {
        userId,
        isExpected: true,
        date: { gte: now }
      },
      orderBy: { date: 'asc' }
    }),
    prisma.collegeCommitment.findMany({
      where: {
        userId,
        status: { not: 'PAID' }
      }
    })
  ]);

  const currentBalance = summary.currentLiquidBalance;
  const receivedIncome = summary.totalReceivedIncome;
  const totalExpenses = summary.totalExpenses;
  const totalSavingsAllocated = summary.totalSavingsAllocated;
  const unpaidCommitmentsTotal = summary.unpaidCommitmentsTotal;
  const dailyEssentialBurn = summary.dailyEssentialBurn;
  const dailyTotalBurn = summary.dailyTotalBurn;
  const runwayDaysEssential = summary.runwayDaysEssential;
  const runwayDaysTotal = summary.runwayDaysTotal;
  const unpaidCommitments = commitments;

  let nextExpectedIncome: RunwayAnalysisResult['nextExpectedIncome'] = null;
  let daysToNextIncome = 30; // default 30 days if not scheduled

  if (futureIncomes.length > 0) {
    const nextInc = futureIncomes[0];
    const diffTime = new Date(nextInc.date).getTime() - now.getTime();
    daysToNextIncome = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    nextExpectedIncome = {
      amount: nextInc.amount,
      source: nextInc.source,
      date: nextInc.date.toISOString(),
      daysAway: daysToNextIncome
    };
  }

  // Shortfall detection before next income arrives
  const hasShortfallBeforeNextIncome = runwayDaysEssential < daysToNextIncome;
  const essentialCostUntilIncome = dailyEssentialBurn * daysToNextIncome;

  // Upcoming commitments due before next income
  const commitmentsBeforeIncome = unpaidCommitments
    .filter(c => {
      const due = new Date(c.dueDate);
      const limit = new Date(now.getTime() + daysToNextIncome * 24 * 60 * 60 * 1000);
      return due >= now && due <= limit;
    })
    .reduce((sum, c) => sum + (c.amount - c.paidAmount), 0);

  const neededCashUntilIncome = essentialCostUntilIncome + commitmentsBeforeIncome;
  const shortfallAmount = Math.max(0, neededCashUntilIncome - currentBalance);

  // Suggested daily limit:
  // (currentBalance - commitmentsBeforeIncome) / daysToNextIncome
  const safeDisposable = Math.max(0, currentBalance - commitmentsBeforeIncome);
  const suggestedDailyLimit = Math.max(0, Math.floor(safeDisposable / daysToNextIncome));

  // Determine overall status
  let status: 'HEALTHY' | 'MODERATE' | 'CRITICAL' = 'HEALTHY';
  if (runwayDaysEssential < 10 || (hasShortfallBeforeNextIncome && shortfallAmount > 2000)) {
    status = 'CRITICAL';
  } else if (runwayDaysEssential < 20 || hasShortfallBeforeNextIncome) {
    status = 'MODERATE';
  }

  // Day-by-day trajectory forecast for up to `forecastDays`
  const forecast: RunwayForecastItem[] = [];
  let runningBalance = currentBalance;

  for (let d = 0; d <= forecastDays; d++) {
    const simDate = new Date(now);
    simDate.setDate(simDate.getDate() + d);
    const dateStr = simDate.toISOString().split('T')[0];
    const events: string[] = [];

    // Deduct daily essential burn (on day 0, no deduction yet)
    if (d > 0) {
      runningBalance -= dailyEssentialBurn;
    }

    // Check if any expected income arrives on this day
    const incMatches = futureIncomes.filter(inc => {
      const iDate = new Date(inc.date).toISOString().split('T')[0];
      return iDate === dateStr;
    });
    for (const inc of incMatches) {
      runningBalance += inc.amount;
      events.push(`Received expected ${inc.source}: +₹${inc.amount.toLocaleString('en-IN')}`);
    }

    // Check if any college commitment is due on this day
    const commMatches = unpaidCommitments.filter(comm => {
      const cDate = new Date(comm.dueDate).toISOString().split('T')[0];
      return cDate === dateStr;
    });
    for (const comm of commMatches) {
      const remaining = comm.amount - comm.paidAmount;
      runningBalance -= remaining;
      events.push(`Due: ${comm.title} -₹${remaining.toLocaleString('en-IN')}`);
    }

    forecast.push({
      day: d,
      date: dateStr,
      projectedBalance: Math.round(runningBalance),
      events,
      isShortfall: runningBalance < 0
    });
  }

  const assumptions = [
    `Daily essential burn rate is estimated at ₹${Math.round(dailyEssentialBurn)}/day based on verified recurring living expenses.`,
    `Projected balance accounts for ₹${unpaidCommitmentsTotal.toLocaleString('en-IN')} in scheduled college commitments.`,
    `Forecast assumes expected allowance/income arrives on scheduled dates without delay.`,
    `Savings goals allocations (₹${totalSavingsAllocated.toLocaleString('en-IN')}) are ring-fenced and not treated as disposable spending.`,
    `This forecast is an advisory mathematical simulation, not a financial guarantee.`
  ];

  return {
    currentBalance: Math.round(currentBalance),
    totalReceivedIncome: Math.round(receivedIncome),
    totalExpenses: Math.round(totalExpenses),
    totalSavingsAllocated: Math.round(totalSavingsAllocated),
    unpaidCommitmentsTotal: Math.round(unpaidCommitmentsTotal),
    dailyEssentialBurn: Math.round(dailyEssentialBurn),
    dailyTotalBurn: Math.round(dailyTotalBurn),
    runwayDaysEssential,
    runwayDaysTotal,
    nextExpectedIncome,
    hasShortfallBeforeNextIncome,
    shortfallAmount: Math.round(shortfallAmount),
    suggestedDailyLimit,
    forecast,
    assumptions,
    status
  };
}
