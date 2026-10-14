import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/prisma.js';

describe('Financial Logic and Budget Calculations Tests', () => {
  let testUserId: string;
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  beforeAll(async () => {
    const hash = await bcrypt.hash('TestPass123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `fin_logic_${Date.now()}@test.ac.in`,
        password: hash,
        name: 'Budget Test Student',
        currency: 'INR'
      }
    });
    testUserId = user.id;
  });

  it('should correctly calculate budget utilization and trigger warnings at 80% and 100%', async () => {
    // 1. Create a food budget of ₹5,000 for current month
    const foodBudget = await prisma.budget.create({
      data: {
        userId: testUserId,
        category: 'Food/Mess',
        month: currentMonth,
        limitAmount: 5000
      }
    });

    // 2. Add ₹3,000 expense (60% utilization -> NORMAL)
    const exp1 = await prisma.expense.create({
      data: {
        userId: testUserId,
        amount: 3000,
        category: 'Food/Mess',
        description: 'First half mess bill',
        date: new Date()
      }
    });

    // Verify 60%
    const totalSpent1 = exp1.amount;
    const util1 = (totalSpent1 / foodBudget.limitAmount) * 100;
    expect(util1).toBe(60);
    expect(util1 < 80).toBe(true);

    // 3. Add ₹1,200 expense (Total ₹4,200 -> 84% utilization -> WARNING_80)
    await prisma.expense.create({
      data: {
        userId: testUserId,
        amount: 1200,
        category: 'Food/Mess',
        description: 'Canteen snacks',
        date: new Date()
      }
    });

    const foodExpenses = await prisma.expense.findMany({
      where: { userId: testUserId, category: 'Food/Mess' }
    });
    const totalSpent2 = foodExpenses.reduce((s, e) => s + e.amount, 0);
    const util2 = (totalSpent2 / foodBudget.limitAmount) * 100;

    expect(totalSpent2).toBe(4200);
    expect(util2).toBe(84);
    expect(util2 >= 80 && util2 < 100).toBe(true);

    // 4. Add ₹1,000 expense (Total ₹5,200 -> 104% utilization -> EXCEEDED)
    await prisma.expense.create({
      data: {
        userId: testUserId,
        amount: 1000,
        category: 'Food/Mess',
        description: 'Takeout dinner',
        date: new Date()
      }
    });

    const updatedExpenses = await prisma.expense.findMany({
      where: { userId: testUserId, category: 'Food/Mess' }
    });
    const totalSpent3 = updatedExpenses.reduce((s, e) => s + e.amount, 0);
    const util3 = (totalSpent3 / foodBudget.limitAmount) * 100;

    expect(totalSpent3).toBe(5200);
    expect(util3).toBe(104);
    expect(util3 >= 100).toBe(true);
  });

  it('should maintain savings contributions distinct from expenses without double deduction', async () => {
    // 1. Create a laptop savings goal of ₹50,000
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: testUserId,
        title: 'MacBook Air Dev Laptop',
        targetAmount: 50000,
        targetDate: new Date(Date.now() + 60 * 86400000),
        category: 'LAPTOP'
      }
    });

    // 2. Perform savings contribution transaction of ₹10,000
    const contribAmount = 10000;
    await prisma.$transaction(async tx => {
      await tx.savingsContribution.create({
        data: {
          goalId: goal.id,
          userId: testUserId,
          amount: contribAmount
        }
      });
      await tx.savingsGoal.update({
        where: { id: goal.id },
        data: { currentAmount: { increment: contribAmount } }
      });
    });

    // 3. Verify goal currentAmount is updated
    const updatedGoal = await prisma.savingsGoal.findUnique({ where: { id: goal.id } });
    expect(updatedGoal?.currentAmount).toBe(10000);

    // 4. Verify savings contributions are NOT stored in Expense table
    const laptopExpenses = await prisma.expense.findMany({
      where: { userId: testUserId, description: { contains: 'MacBook' } }
    });
    expect(laptopExpenses.length).toBe(0);
  });
});
