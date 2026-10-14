import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/prisma.js';
import { checkAffordability } from '../server/services/afford.service.js';

describe('Affordability Engine and College Payment Prioritization Tests', () => {
  let studentId: string;

  beforeAll(async () => {
    const hash = await bcrypt.hash('AffordPass123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `afford_${Date.now()}@test.ac.in`,
        password: hash,
        name: 'Affordability Test Student',
        currency: 'INR'
      }
    });
    studentId = user.id;

    // Income ₹20,000
    await prisma.income.create({
      data: {
        userId: studentId,
        amount: 20000,
        source: 'Allowance',
        description: 'Semester Opening Allowance',
        isExpected: false
      }
    });

    // College Commitment ₹15,000 due in 10 days
    const dueSoon = new Date();
    dueSoon.setDate(dueSoon.getDate() + 10);
    await prisma.collegeCommitment.create({
      data: {
        userId: studentId,
        title: 'Hostel Room Fee',
        amount: 15000,
        dueDate: dueSoon,
        priority: 'HIGH',
        category: 'Hostel',
        status: 'UNPAID'
      }
    });
  });

  it('should flag purchase as UNSAFE if it cuts into upcoming college fee commitments', async () => {
    // Current balance = 20,000. Commitment = 15,000.
    // Free disposable cash = 20,000 - 15,000 - 1,500 buffer = 3,500.
    // Student tries to buy ₹8,000 gaming console.
    const result = await checkAffordability(studentId, {
      itemTitle: 'Gaming Headphones & Controller',
      price: 8000,
      category: 'Entertainment',
      urgency: 'WANT'
    });

    expect(result.decision).toBe('UNSAFE');
    expect(result.projectedBalanceAfter).toBe(12000); // 20000 - 8000 = 12000, less than 15000 fee!
    expect(result.reasons.some(r => r.includes('default'))).toBe(true);
  });

  it('should allow affordable purchase when price is well within true disposable cash', async () => {
    // Student wants to buy ₹800 engineering stationery
    const result = await checkAffordability(studentId, {
      itemTitle: 'Engineering Drawing Instruments',
      price: 800,
      category: 'Academic/Books',
      urgency: 'NEED'
    });

    // 800 <= trueDisposableCash (3500)
    expect(result.decision).toBe('AFFORDABLE');
    expect(result.projectedBalanceAfter).toBe(19200);
    expect(result.scenarios.buyNow.feasible).toBe(true);
  });

  it('should apply college payment correctly without double counting in ledger', async () => {
    // Retrieve commitment
    const comm = await prisma.collegeCommitment.findFirst({
      where: { userId: studentId, status: 'UNPAID' }
    });
    expect(comm).toBeDefined();

    // Make partial payment of ₹5,000 via transaction
    const payAmount = 5000;
    const updated = await prisma.$transaction(async tx => {
      const exp = await tx.expense.create({
        data: {
          userId: studentId,
          amount: payAmount,
          category: 'Hostel/Rent',
          description: `Payment for: ${comm!.title}`,
          isEssential: true,
          commitmentId: comm!.id
        }
      });

      return await tx.collegeCommitment.update({
        where: { id: comm!.id },
        data: {
          paidAmount: { increment: payAmount },
          status: 'PARTIAL',
          expenseId: exp.id
        }
      });
    });

    expect(updated.paidAmount).toBe(5000);
    expect(updated.status).toBe('PARTIAL');
    expect(updated.expenseId).toBeDefined();

    // Verify expense has commitmentId pointer preventing duplicate counting
    const exp = await prisma.expense.findUnique({ where: { id: updated.expenseId! } });
    expect(exp?.commitmentId).toBe(comm!.id);
  });
});
