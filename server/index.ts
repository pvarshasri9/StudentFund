import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';

import authRoutes from './routes/auth.routes.js';
import incomeRoutes from './routes/income.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import runwayRoutes from './routes/runway.routes.js';
import collegeExpenseRoutes from './routes/college-expenses.routes.js';
import savingsRoutes from './routes/savings.routes.js';
import affordRoutes from './routes/afford.routes.js';
import insightsRoutes from './routes/insights.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import remindersRoutes from './routes/reminders.routes.js';
import literacyRoutes from './routes/literacy.routes.js';
import financialsRoutes from './routes/financials.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// API health route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'StudentFund — Smart Student Budget and Savings Planner',
    project: 'YUKTI Innovation Challenge',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/runway', runwayRoutes);
app.use('/api/college-expenses', collegeExpenseRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/afford', affordRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/literacy', literacyRoutes);
app.use('/api/financials', financialsRoutes);

// Serve production static frontend if built
const candidates = [
  path.resolve(process.cwd(), 'dist/client'),
  path.resolve(__dirname, '../dist/client'),
  path.resolve(__dirname, '../../dist/client')
];
const clientDistPath = candidates.find(p => fs.existsSync(path.join(p, 'index.html'))) || path.resolve(process.cwd(), 'dist/client');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  // In dev mode when client has not been built yet and is served by Vite on port 5173
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head><title>StudentFund API Server</title></head>
      <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
        <h1 style="color: #38bdf8;">StudentFund API Server Running</h1>
        <p>Access the React UI via the Vite development server (usually at <a style="color: #818cf8;" href="http://localhost:5173">http://localhost:5173</a>) or build the client with <code>npm run build</code>.</p>
        <p>API Endpoint: <a style="color: #34d399;" href="/api/health">/api/health</a></p>
      </body>
    </html>
  `);
});

app.listen(config.port, () => {
  console.log(`[StudentFund] Unified Server running on http://localhost:${config.port}`);
  console.log(`[StudentFund] API available at http://localhost:${config.port}/api`);
});
