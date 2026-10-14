import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'studentfund_default_secure_secret_yukti_2025',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db'
};
