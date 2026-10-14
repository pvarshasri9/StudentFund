import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/prisma.js';
import { calculateRunway } from '../server/services/runway.service.js';
import { checkAffordability } from '../server/services/afford.service.js';
import { generateSmartInsights } from '../server/services/insights.service.js';
import { generateOverviewReport, exportTransactionsCsv } from '../server/services/report.service.js';

describe('Complete Student Workflow Verification (Requirement 8)', () => {
  const studentEmail = `workflow_student_${Date.now()}@campus.ac.in`;
  const rawPassword = 'StudentSecret2025!';
  let studentId: string;

  it('Step 1: Register and sign in with encrypted password', async () => {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: studentEmail,
        password: hashedPassword,
        name: 'Arjun Mehta',
        college: 'IIT Madras',
        course: 'B.Tech Electrical',
        currentSemester: 3,
        monthlyAllowance: 16000,
        currency: 'INR'
      }
    });

    studentId = user.id;
    expect(studentId).toBeDefined();

    // Verify sign in credential match
    const foundUser = await prisma.user.findUnique({ where: { email: studentEmail } });
    const isPasswordValid = await bcrypt.compare(rawPassword, foundUser!.password);
    expect(isPasswordValid).toBe(true);
  });

  it('Step 2 & 3: Enter available money and add income & expenses', async () => {
    // Starting balance / parental allowance received
    const inc1 = await prisma.income.create({
      data: {
        userId: studentId,
        amount: 20000,
        source: 'Allowance',
        description: 'Semester Opening Allowance from Parents',
        date: new Date(),
        isExpected: false
      }
    });
    expect(inc1.amount).toBe(20000);

    // Schedule next expected allowance in 30 days
    const nextAllowanceDate = new Date();
    nextAllowanceDate.setDate(nextAllowanceDate.getDate() + 30);
    const incExpected = await prisma.income.create({
      data: {
        userId: studentId,
        amount: 15000,
        source: 'Allowance',
        description: 'Next Month Allowance',
        date: nextAllowanceDate,
        isExpected: true
      }
    });
    expect(incExpected.isExpected).toBe(true);

    // Add essential expenses
    await prisma.expense.create({
      data: {
        userId: studentId,
        amount: 4500,
        category: 'Food/Mess',
        description: 'Hostel Mess Advance',
        isEssential: true
      }
    });

    await prisma.expense.create({
      data: {
        userId: studentId,
        amount: 1200,
        category: 'Academic/Books',
        description: 'Circuit Theory Textbook',
        isEssential: true
      }
    });

    // Add discretionary expense
    await prisma.expense.create({
      data: {
        userId: studentId,
        amount: 800,
        category: 'Food/Mess',
        description: 'Cafe with classmates',
        isEssential: false
      }
    });

    const expenses = await prisma.expense.findMany({ where: { userId: studentId } });
    expect(expenses.length).toBe(3);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    expect(totalSpent).toBe(6500); // 4500 + 1200 + 800
  });

  it('Step 4: Set monthly budget and verify utilization', async () => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const budget = await prisma.budget.create({
      data: {
        userId: studentId,
        category: 'Food/Mess',
        month: currentMonth,
        limitAmount: 6000
      }
    });

    expect(budget.limitAmount).toBe(6000);

    // Food expenses spent = 4500 (mess) + 800 (cafe) = 5300
    // Utilization = 5300 / 6000 = 88.3% -> Should cross 80% threshold!
    const foodExpenses = await prisma.expense.findMany({
      where: { userId: studentId, category: 'Food/Mess' }
    });
    const spentFood = foodExpenses.reduce((s, e) => s + e.amount, 0);
    expect(spentFood).toBe(5300);
    const ratio = (spentFood / budget.limitAmount) * 100;
    expect(ratio).toBeGreaterThanOrEqual(80);
  });

  it('Step 5 & 6: Add upcoming college fee and create savings goal', async () => {
    // College fee commitment
    const feeDue = new Date();
    feeDue.setDate(feeDue.getDate() + 18);
    const fee = await prisma.collegeCommitment.create({
      data: {
        userId: studentId,
        title: 'Semester 3 Exam Fee & Lab Pass',
        amount: 3500,
        dueDate: feeDue,
        priority: 'HIGH',
        category: 'ExamFee',
        status: 'UNPAID'
      }
    });
    expect(fee.amount).toBe(3500);

    // Savings Goal
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: studentId,
        title: 'Emergency Medical & Travel Buffer',
        targetAmount: 5000,
        currentAmount: 2000,
        targetDate: new Date(Date.now() + 60 * 86400000),
        category: 'EMERGENCY'
      }
    });

    await prisma.savingsContribution.create({
      data: {
        goalId: goal.id,
        userId: studentId,
        amount: 2000,
        notes: 'Initial allocation'
      }
    });

    expect(goal.currentAmount).toBe(2000);
  });

  it('Step 7 & 8: Review Money Runway forecast & essential priorities', async () => {
    const runway = await calculateRunway(studentId, 60);

    // Liquid balance = Received(20000) - Spent(6500) - Savings(2000) = 11500
    expect(runway.currentBalance).toBe(11500);
    expect(runway.runwayDaysEssential).toBeGreaterThan(0);
    expect(runway.suggestedDailyLimit).toBeGreaterThan(0);
    expect(runway.unpaidCommitmentsTotal).toBe(3500);
    expect(runway.forecast.length).toBe(61);
  });

  it('Step 9 & 10: Simulate planned purchase and record only on explicit confirmation', async () => {
    // Simulate purchase of a noise-canceling headphone for ₹4,000
    const sim = await checkAffordability(studentId, {
      itemTitle: 'Active Noise Canceling Headphones',
      price: 4000,
      category: 'Personal',
      urgency: 'WANT'
    });

    expect(sim).toBeDefined();
    expect(sim.currentBalance).toBe(11500);
    expect(sim.projectedBalanceAfter).toBe(7500);

    // Verify simulation did NOT create an expense in the database yet
    const beforeExpenses = await prisma.expense.findMany({
      where: { userId: studentId, description: 'Active Noise Canceling Headphones' }
    });
    expect(beforeExpenses.length).toBe(0);

    // User explicitly confirms purchase:
    const recordedExpense = await prisma.expense.create({
      data: {
        userId: studentId,
        amount: sim.price,
        category: sim.category,
        description: sim.itemTitle,
        isEssential: false,
        paymentMethod: 'UPI',
        notes: 'Explicitly confirmed from Can I Afford It? simulator'
      }
    });

    expect(recordedExpense.id).toBeDefined();
    expect(recordedExpense.amount).toBe(4000);
  });

  it('Step 11 & 12: Verify dashboard update, create reminder and check insights', async () => {
    const report = await generateOverviewReport(studentId);
    // New available balance = 11500 - 4000 = 7500
    expect(report.availableBalance).toBe(7500);
    expect(report.totalExpenses).toBe(10500); // 6500 + 4000

    const insights = await generateSmartInsights(studentId);
    expect(insights.length).toBeGreaterThan(0);

    // Create reminder
    const rem = await prisma.reminder.create({
      data: {
        userId: studentId,
        title: 'Pay Semester Exam Fee before hall ticket release',
        dueDate: new Date(Date.now() + 18 * 86400000),
        category: 'COLLEGE_FEE',
        amount: 3500,
        priority: 'HIGH'
      }
    });
    expect(rem.id).toBeDefined();
  });

  it('Step 13: Export financial report to CSV', async () => {
    const csv = await exportTransactionsCsv(studentId);
    expect(csv).toContain('INCOME');
    expect(csv).toContain('EXPENSE');
    expect(csv).toContain('COLLEGE_COMMITMENT');
    expect(csv).toContain('Semester Opening Allowance');
    expect(csv).toContain('Active Noise Canceling Headphones');
  });

  it('Step 14: Sign out, sign in again, and confirm data persists', async () => {
    // Re-query database mimicking a new session after logout
    const reloadedUser = await prisma.user.findUnique({
      where: { email: studentEmail },
      include: {
        incomes: true,
        expenses: true,
        budgets: true,
        commitments: true,
        savingsGoals: true,
        reminders: true
      }
    });

    expect(reloadedUser).toBeDefined();
    expect(reloadedUser!.incomes.length).toBe(2);
    expect(reloadedUser!.expenses.length).toBe(4);
    expect(reloadedUser!.budgets.length).toBe(1);
    expect(reloadedUser!.commitments.length).toBe(1);
    expect(reloadedUser!.savingsGoals.length).toBe(1);
    expect(reloadedUser!.reminders.length).toBe(1);
  });
});
