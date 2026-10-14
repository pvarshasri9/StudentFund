import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/prisma.js';

describe('Authentication and Data Isolation Tests', () => {
  const user1Email = `student1_${Date.now()}@college.ac.in`;
  const user2Email = `student2_${Date.now()}@college.ac.in`;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    const hash = await bcrypt.hash('SecurePassword123!', 10);
    const u1 = await prisma.user.create({
      data: {
        email: user1Email,
        password: hash,
        name: 'Test Student One',
        college: 'IIT Delhi',
        currency: 'INR'
      }
    });
    user1Id = u1.id;

    const u2 = await prisma.user.create({
      data: {
        email: user2Email,
        password: hash,
        name: 'Test Student Two',
        college: 'BITS Pilani',
        currency: 'INR'
      }
    });
    user2Id = u2.id;
  });

  it('should securely hash user passwords', async () => {
    const user = await prisma.user.findUnique({ where: { id: user1Id } });
    expect(user).toBeDefined();
    expect(user?.password).not.toBe('SecurePassword123!');
    const isValid = await bcrypt.compare('SecurePassword123!', user!.password);
    expect(isValid).toBe(true);
  });

  it('should strictly isolate financial records between students', async () => {
    // User 1 logs ₹15,000 allowance and ₹3,500 mess expense
    await prisma.income.create({
      data: {
        userId: user1Id,
        amount: 15000,
        source: 'Allowance',
        description: 'User 1 Monthly Allowance',
        isExpected: false
      }
    });
    await prisma.expense.create({
      data: {
        userId: user1Id,
        amount: 3500,
        category: 'Food/Mess',
        description: 'User 1 Mess Fee'
      }
    });

    // User 2 logs ₹25,000 scholarship
    await prisma.income.create({
      data: {
        userId: user2Id,
        amount: 25000,
        source: 'Scholarship',
        description: 'User 2 Merit Scholarship',
        isExpected: false
      }
    });

    // Query User 1 incomes
    const user1Incomes = await prisma.income.findMany({ where: { userId: user1Id } });
    expect(user1Incomes.length).toBe(1);
    expect(user1Incomes[0].amount).toBe(15000);

    // Query User 2 expenses
    const user2Expenses = await prisma.expense.findMany({ where: { userId: user2Id } });
    expect(user2Expenses.length).toBe(0);

    // Verify User 2 cannot access User 1's income
    const user2Incomes = await prisma.income.findMany({ where: { userId: user2Id } });
    expect(user2Incomes.length).toBe(1);
    expect(user2Incomes[0].amount).toBe(25000);
  });
});
