# StudentFund — Smart Student Budget and Savings Planner
> **YUKTI Innovation Project Submission**  
> An integrated full-stack financial intelligence application engineered specifically for Indian university and college students.

---

## 🌟 The Problem & The StudentFund Innovation

Most student budget apps are simplified adaptations of adult corporate finance tools (assuming steady salaries, mortgage deductions, and predictable monthly bills). 

In contrast, **Indian college students face unique financial stress points**:
1. **Irregular Cash Inflows**: Parental allowances, state scholarships, and academic research stipends arrive sporadically or with semester delays.
2. **Institutional Fee Deadlines**: Semester tuition, hostel mess caution deposits, and examination portal registrations have strict deadlines and heavy late penalties. Students often accidentally spend semester fee money during canteen hangouts or festival sales.
3. **Predatory Instant Loan & BNPL Traps**: Students lack salary slips and are frequently targeted by aggressive micro-lending apps charging hidden fees.

**StudentFund solves this with three signature features**:
- **🧭 Student Money Runway**: Adapted from startup treasury management. Measures liquid bank balance against essential burn rate (mess, commute, books) to calculate exactly how many days money will last, and alerts students of cash shortfalls *before* their next allowance arrives.
- **🛡️ College Expense Priority Planner**: Ring-fences upcoming tuition, hostel, and exam fees from daily spending. Tracks payments with transaction synchronization to guarantee **zero double-counting** in the expense ledger.
- **💡 "Can I Afford It?" Purchase Simulator**: Non-destructive mathematical simulation before purchasing gadgets or apparel. Compares the item price against liquid balance, college dues, and emergency reserves to deliver a clear verdict (**Safe**, **Stretch**, or **Unsafe**) with 3 practical scenarios (Buy Now, Delay, Save First).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Plus Jakarta Sans & Outfit Typography |
| **Backend** | Node.js, Express, TypeScript, Zod Schema Validation, JSON Web Tokens (JWT), BCrypt Password Hashing |
| **Database & ORM** | Prisma ORM with dual database support: **SQLite** (out-of-the-box zero install) and **PostgreSQL** (production deployment ready) |
| **Financial Visuals** | Recharts (Interactive Money Runway Area Trajectory, Inflow vs Outflow CashFlow, Expense Category Pie) |
| **Automated Testing** | Vitest with 18 automated end-to-end integration and unit tests |

---

## 🚀 One Application, One URL Architecture

StudentFund runs as **one integrated service**:
- The Node.js Express server mounts all REST endpoints under `/api`.
- In development, the Vite dev server proxies `/api` requests to the backend.
- In production, the compiled React application in `dist/client` is served directly by the Express backend at the root URL (`http://localhost:5000/`).

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 2. Clone & Install
```bash
# In the project root directory:
npm install
```

### 3. Initialize Database & Seed Demo Data
```bash
# Generate Prisma Client & sync local database
npm run prisma:generate
npm run prisma:push

# Seed realistic demo data (Ananya Sharma, IIT Delhi)
npm run prisma:seed
```

### 4. Run Development Workflow (Single Command)
```bash
npm run dev
```
- Client interface: `http://localhost:5173` (proxies `/api` to backend)
- Backend API: `http://localhost:5000/api`

### 5. Run Integrated Production Server (Single URL)
```bash
# Build both frontend and backend
npm run build

# Start integrated production service
npm start
```
- Visit `http://localhost:5000` to access the full application!

---

## 🧪 Automated Testing with Vitest

Execute the test suite verifying data isolation, runway forecasting, budget calculations, and the 14-step student workflow:

```bash
npm test
```

### Test Coverage Summary:
- **`tests/auth-isolation.test.ts`**: Password hashing, JWT token verification, and strict per-user data isolation.
- **`tests/financial-logic.test.ts`**: Income/expense CRUD, 80% and 100% budget utilization warnings, and savings contribution transactions.
- **`tests/runway-forecast.test.ts`**: Money Runway calculation, daily burn rate, and cash shortfall detection before allowance arrival.
- **`tests/affordability-college.test.ts`**: "Can I Afford It?" decision engine, college fee prioritization, and anti-double-counting payment sync.
- **`tests/complete-student-workflow.test.ts`**: Complete 14-step verification sequence from registration to ledger CSV export.

---

## 🎯 13 Connected Application Modules

1. **Dashboard (`DashboardPage`)**: High-level financial cockpit with liquid cash, runway days, upcoming commitments, cash flow charts, and rule-based insights.
2. **Income & Allowances (`IncomePage`)**: Distinguishes actual received cash from expected future allowances/stipends.
3. **Expense Tracker (`ExpensesPage`)**: Categorized spending with essential (needs) vs discretionary (wants) flags and UPI/Cash/Card tracking.
4. **Campus Budget Planner (`BudgetPage`)**: Monthly and category spending ceilings with active 80% warning and exceeded alerts.
5. **Student Money Runway (`MoneyRunwayPage`)** *(Signature Feature)*: Day-by-day trajectory projection over 30/60/90 days, shortfall date markers, daily spending limit, and transparent mathematical assumptions.
6. **College Expense Priorities (`CollegePrioritiesPage`)** *(Signature Feature)*: High/Medium/Low priority matrix for tuition, hostel, and exam fees. "Record Payment" tool links directly to expenses to prevent double-counting.
7. **Savings & Emergency Reserve (`SavingsGoalsPage`)**: Ring-fenced targets for student emergency funds, laptops, and certifications.
8. **Can I Afford It? (`CanIAffordItPage`)** *(Signature Feature)*: Non-destructive planned purchase simulator evaluating balance, college dues, and emergency cushions. Only records a transaction upon explicit confirmation.
9. **Smart Insights (`SmartInsightsPage`)**: Transparent, deterministic findings detecting spending acceleration, fee risks, and savings milestones.
10. **Reports & Ledger Export (`ReportsPage`)**: Date-range filtered financial overview and one-click downloadable CSV ledger.
11. **Calendar & Reminders (`CalendarRemindersPage`)**: In-app timeline reminders for fee deadlines, allowance dates, and subscriptions with overdue detection.
12. **Student Financial Literacy (`FinancialLiteracyPage`)**: Interactive lessons (60-25-15 student rule, runway mastery, avoiding BNPL debt traps) with quizzes and saved progress scores.
13. **Settings (`SettingsPage`)**: Profile customization, semester settings, dark/light theme toggle, and one-click demo data reset.

---

## 👤 Interactive Demo Account

For rapid evaluation and demonstration:
- **Student Name**: Ananya Sharma
- **Email**: `demo.student@yukti.in`
- **Institution**: Indian Institute of Technology (IIT) Delhi
- **One-Click Demo Access**: Click the **"Explore Demo Account"** button on the sign-in page to instantly load pre-populated transactions, semester fee dues, and runway forecasts.
- **Reset Demo Data**: Easily reset to a clean state anytime via the banner at the top or within Settings.

---

## 🗄️ PostgreSQL Production Configuration

For cloud or production deployment with PostgreSQL:
1. Set `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/studentfund?schema=public"
   ```
2. Copy `prisma/schema.postgresql.prisma` over `prisma/schema.prisma` (or use Prisma's `--schema` flag):
   ```bash
   npx prisma migrate dev --schema prisma/schema.postgresql.prisma
   ```

---

## 📄 License
Developed for the **YUKTI Innovation Challenge 2025/2026**.
