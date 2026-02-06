/**
 * MortgagePros Holiday Calendar API Server
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';

import { holidayRoutes } from './routes/holidays';
import { authRoutes } from './routes/auth';
import { syncRoutes } from './routes/sync';
import { settingsRoutes } from './routes/settings';
import { syncHolidays } from './services/syncService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Serve uploaded files (logos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/holidays', holidayRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sync-holidays', syncRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Daily cron job to sync holidays at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Running daily holiday sync...');
  try {
    await syncHolidays();
    console.log('[CRON] Holiday sync completed successfully');
  } catch (error) {
    console.error('[CRON] Holiday sync failed:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MortgagePros Calendar API running on port ${PORT}`);
  console.log(`📅 Holiday sync cron scheduled for 2 AM daily`);
});

export default app;
