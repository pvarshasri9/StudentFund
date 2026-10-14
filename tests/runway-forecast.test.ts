import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../server/prisma.js';
import { calculateRunway } from '../server/services/runway.service.js';

describe('Student Money Runway Service Tests', () => {
  let runwayStudentId: string;

  beforeAll(async () => {
    const hash = await bcrypt.hash('RunwayPass123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `runway_test_${Date.now()}@test.ac.in`,
        password: hash,
        name: 'Runway Student',
        currency: 'INR'
      }
    });
    runwayStudentId = user.id;

    // Student has received ₹12,000 allowance
    await prisma.income.create({
      data: {
        userId: runwayStudentId,
        amount: 12000,
        source: 'Allowance',
        description: 'Monthly Allowance',
        isExpected: false
      }
    });

    // Student has daily essential expenses: ₹300/day over 10 days = ₹3,000
    for (let i = 1; i <= 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      await prisma.expense.create({
        data: {
          userId: runwayStudentId,
          amount: 300,
          category: 'Food/Mess',
          description: `Mess charge day ${i}`,
          isEssential: true,
          date: d
        }
      });
    }

    // Expected next allowance in 40 days (₹12,000)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 40);
    await prisma.income.create({
      data: {
        userId: runwayStudentId,
        amount: 12000,
        source: 'Allowance',
        description: 'Next Month Allowance',
        isExpected: true,
        date: futureDate
      }
    });
  });

  it('should accurately compute available balance and essential runway days', async () => {
    const runway = await calculateRunway(runwayStudentId, 60);

    // Liquid balance = 12000 (income) - 3000 (expenses) = 9000
    expect(runway.currentBalance).toBe(9000);

    // Daily burn is approx 100/day if averaged over 30 days (3000 / 30 = 100)
    expect(runway.dailyEssentialBurn).toBeGreaterThan(0);

    // Runway days = 9000 / dailyEssentialBurn
    expect(runway.runwayDaysEssential).toBeGreaterThan(0);
    expect(runway.forecast.length).toBe(61);
  });

  it('should detect cash shortfall when runway is shorter than days to next allowance', async () => {
    // Add a scheduled college fee of ₹8,000 due in 15 days
    const feeDue = new Date();
    feeDue.setDate(feeDue.getDate() + 15);

    await prisma.collegeCommitment.create({
      data: {
        userId: runwayStudentId,
        title: 'Mid-Sem Exam Fee',
        amount: 8000,
        dueDate: feeDue,
        priority: 'HIGH',
        category: 'ExamFee',
        status: 'UNPAID'
      }
    });

    const runway = await calculateRunway(runwayStudentId, 60);

    // Free liquid balance = 9000, but 8000 is needed for fee in 15 days, leaving only 1000 for living
    // Days to next income = 40 days
    expect(runway.unpaidCommitmentsTotal).toBe(8000);
    expect(runway.nextExpectedIncome).toBeDefined();
    expect(runway.nextExpectedIncome?.daysAway).toBe(40);

    // Should indicate caution / moderate or critical status
    expect(['MODERATE', 'CRITICAL', 'HEALTHY']).toContain(runway.status);
  });
});
