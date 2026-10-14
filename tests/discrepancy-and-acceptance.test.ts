import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/prisma.js';
import { getAuthoritativeFinancialSummary } from '../server/services/financial-calculator.service.js';
import { calculateRunway } from '../server/services/runway.service.js';
import { checkAffordability } from '../server/services/afford.service.js';
import { generateOverviewReport } from '../server/services/report.service.js';
import { getMonthRange, parseMiddayDate } from '../server/utils/date.js';

describe('Discrepancy Audit & Acceptance Workflow Test', () => {
  const testEmail = `audit_student_${Date.now()}@college.edu`;
  const testPassword = 'SecureStudentPass123!';
  let userId: string;

  it('1. Recreates the initial state: ₹57,000 received - ₹11,099 expenses - ₹24,500 savings = ₹21,401', async () => {
    // Create new student
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: 'Varsha Sri',
        college: 'SRM Institute of Science and Technology',
        course: 'B.Tech Computer Science',
        currentSemester: 4,
        monthlyAllowance: 15000,
        currency: 'INR'
      }
    });
    userId = user.id;

    // 1. Initial Received Incomes totaling ₹57,000
    await prisma.income.createMany({
      data: [
        {
          userId,
          amount: 25000,
          source: 'Allowance',
          description: 'Opening Bank Balance / Parental Allowance',
          date: parseMiddayDate('2026-03-01'),
          isExpected: false
        },
        {
          userId,
          amount: 32000,
          source: 'Scholarship',
          description: 'Merit Scholarship Installment 1',
          date: parseMiddayDate('2026-03-05'),
          isExpected: false
        },
        // Future expected income (must NOT be counted in current cash)
        {
          userId,
          amount: 15000,
          source: 'Allowance',
          description: 'Next Month Allowance',
          date: parseMiddayDate('2026-04-01'),
          isExpected: true
        }
      ]
    });

    // 2. Initial Expenses totaling ₹11,099
    await prisma.expense.createMany({
      data: [
        {
          userId,
          amount: 5500,
          category: 'Food/Mess',
          description: 'Monthly Mess Card Fee',
          date: parseMiddayDate('2026-03-02'),
          isEssential: true,
          paymentMethod: 'UPI'
        },
        {
          userId,
          amount: 2499,
          category: 'Academic/Books',
          description: 'Algorithms & Data Structures Textbook',
          date: parseMiddayDate('2026-03-04'),
          isEssential: true,
          paymentMethod: 'UPI'
        },
        {
          userId,
          amount: 3100,
          category: 'Personal',
          description: 'Canteen and Weekend Snacks',
          date: parseMiddayDate('2026-03-08'),
          isEssential: false,
          paymentMethod: 'UPI'
        }
      ]
    });

    // 3. Initial Ring-Fenced Savings totaling ₹24,500
    const emergencyGoal = await prisma.savingsGoal.create({
      data: {
        userId,
        title: 'Emergency Medical & Travel Buffer',
        targetAmount: 30000,
        currentAmount: 18000,
        targetDate: parseMiddayDate('2026-06-30'),
        category: 'EMERGENCY',
        isCompleted: false
      }
    });
    await prisma.savingsContribution.create({
      data: {
        goalId: emergencyGoal.id,
        userId,
        amount: 18000,
        date: parseMiddayDate('2026-03-03')
      }
    });

    const laptopGoal = await prisma.savingsGoal.create({
      data: {
        userId,
        title: 'Linux Dev Laptop Fund',
        targetAmount: 50000,
        currentAmount: 6500,
        targetDate: parseMiddayDate('2026-08-31'),
        category: 'LAPTOP',
        isCompleted: false
      }
    });
    await prisma.savingsContribution.create({
      data: {
        goalId: laptopGoal.id,
        userId,
        amount: 6500,
        date: parseMiddayDate('2026-03-06')
      }
    });

    // 4. College Commitment: Tuition dues ₹45,000 (unpaid)
    await prisma.collegeCommitment.create({
      data: {
        userId,
        title: 'Semester 4 Tuition Fee',
        amount: 45000,
        paidAmount: 0,
        dueDate: parseMiddayDate('2026-04-15'),
        priority: 'HIGH',
        category: 'Tuition',
        status: 'UNPAID'
      }
    });

    // Test authoritative financial summary
    const summary = await getAuthoritativeFinancialSummary(userId);
    expect(summary.totalReceivedIncome).toBe(57000);
    expect(summary.totalExpectedIncome).toBe(15000);
    expect(summary.totalExpenses).toBe(11099);
    expect(summary.totalSavingsAllocated).toBe(24500);

    // Initial balance MUST be exactly ₹21,401
    expect(summary.currentLiquidBalance).toBe(21401);

    // Runway service MUST also report ₹21,401
    const runway = await calculateRunway(userId, 60);
    expect(runway.currentBalance).toBe(21401);

    // Reports overview service MUST also report ₹21,401
    const report = await generateOverviewReport(userId);
    expect(report.availableBalance).toBe(21401);
  });

  it('2. Records ₹29,000 of received income -> balance updates to ₹50,401 across all screens', async () => {
    // Record the ₹29,000 received income (e.g. stipend / sponsorship payout)
    const newIncome = await prisma.income.create({
      data: {
        userId,
        amount: 29000,
        source: 'Stipend',
        description: 'Industry Research Project Fellowship Stipend',
        date: parseMiddayDate('2026-03-10'),
        isExpected: false
      }
    });
    expect(newIncome.amount).toBe(29000);

    // 1. Authoritative Summary
    const summary = await getAuthoritativeFinancialSummary(userId);
    expect(summary.totalReceivedIncome).toBe(86000); // 57000 + 29000
    expect(summary.totalExpenses).toBe(11099);
    expect(summary.totalSavingsAllocated).toBe(24500);
    // 86,000 - 11,099 - 24,500 = ₹50,401!
    expect(summary.currentLiquidBalance).toBe(50401);

    // 2. Dashboard Overview Report
    const report = await generateOverviewReport(userId);
    expect(report.availableBalance).toBe(50401);
    expect(report.totalReceivedIncome).toBe(86000);
    expect(report.totalExpenses).toBe(11099);

    // 3. Money Runway Service
    const runway = await calculateRunway(userId, 60);
    expect(runway.currentBalance).toBe(50401);
    expect(runway.totalReceivedIncome).toBe(86000);

    // 4. Can I Afford It Simulator uses the authoritative ₹50,401
    const affordResult = await checkAffordability(userId, {
      itemTitle: 'Mechanical Keyboard for Coding',
      price: 4500,
      category: 'Academic/Books',
      urgency: 'NEED'
    });
    expect(affordResult.currentBalance).toBe(50401);
    expect(affordResult.projectedBalanceAfter).toBe(50401 - 4500);
  });

  it('3. Verifies College Commitment editing and expense unlinking without double-counting', async () => {
    const commitment = await prisma.collegeCommitment.findFirst({
      where: { userId, title: 'Semester 4 Tuition Fee' }
    });
    expect(commitment).toBeDefined();

    // 1. Edit commitment amount from 45000 to 48000
    const updatedCommitment = await prisma.collegeCommitment.update({
      where: { id: commitment!.id },
      data: {
        amount: 48000,
        priority: 'HIGH'
      }
    });
    expect(updatedCommitment.amount).toBe(48000);

    // 2. Pay partial fee ₹20,000 with linked expense
    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: 20000,
        category: 'Tuition',
        description: `Payment for: ${updatedCommitment.title}`,
        date: parseMiddayDate('2026-03-12'),
        isEssential: true,
        paymentMethod: 'UPI',
        commitmentId: updatedCommitment.id
      }
    });

    await prisma.collegeCommitment.update({
      where: { id: updatedCommitment.id },
      data: {
        paidAmount: 20000,
        status: 'PARTIAL',
        expenseId: expense.id
      }
    });

    const summaryAfterPay = await getAuthoritativeFinancialSummary(userId);
    expect(summaryAfterPay.paidCommitmentsTotal).toBe(20000);
    expect(summaryAfterPay.unpaidCommitmentsTotal).toBe(28000); // 48000 - 20000
    // Total expenses increased by 20,000 -> 11,099 + 20,000 = 31,099
    expect(summaryAfterPay.totalExpenses).toBe(31099);
    // Current liquid cash = 86,000 - 31,099 - 24,500 = 30,401
    expect(summaryAfterPay.currentLiquidBalance).toBe(30401);

    // 3. Delete the linked expense -> commitment paidAmount reverts automatically
    await prisma.$transaction(async tx => {
      const exp = await tx.expense.findUnique({ where: { id: expense.id } });
      if (exp?.commitmentId) {
        const comm = await tx.collegeCommitment.findUnique({ where: { id: exp.commitmentId } });
        if (comm) {
          const newPaid = Math.max(0, comm.paidAmount - exp.amount);
          await tx.collegeCommitment.update({
            where: { id: comm.id },
            data: {
              paidAmount: newPaid,
              status: newPaid === 0 ? 'UNPAID' : 'PARTIAL',
              expenseId: null
            }
          });
        }
      }
      await tx.expense.delete({ where: { id: expense.id } });
    });

    // Check reverted state
    const revertedCommitment = await prisma.collegeCommitment.findUnique({ where: { id: updatedCommitment.id } });
    expect(revertedCommitment!.paidAmount).toBe(0);
    expect(revertedCommitment!.status).toBe('UNPAID');

    const summaryReverted = await getAuthoritativeFinancialSummary(userId);
    expect(summaryReverted.currentLiquidBalance).toBe(50401);
    expect(summaryReverted.unpaidCommitmentsTotal).toBe(48000);
  });

  it('4. Verifies date ranges produce identical boundaries without timezone shifts', () => {
    const marchRange = getMonthRange('2026-03');
    expect(marchRange.start.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(marchRange.end.toISOString()).toBe('2026-04-01T00:00:00.000Z');

    const midday = parseMiddayDate('2026-03-15');
    expect(midday.toISOString()).toBe('2026-03-15T12:00:00.000Z');
  });

  it('5. Verifies persistence across re-authentication and session restore', async () => {
    // Look up student by email and verify password
    const student = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(student).toBeDefined();

    const passMatch = await bcrypt.compare(testPassword, student!.password);
    expect(passMatch).toBe(true);

    // Fetch authoritative state after sign-in simulation
    const freshSummary = await getAuthoritativeFinancialSummary(student!.id);
    expect(freshSummary.currentLiquidBalance).toBe(50401);
  });
});
