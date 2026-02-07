/**
 * MortgagePros Holiday Calendar API Server
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import bcrypt from 'bcryptjs';

import { holidayRoutes } from './routes/holidays';
import { authRoutes } from './routes/auth';
import { syncRoutes } from './routes/sync';
import { settingsRoutes } from './routes/settings';
import { emailRoutes } from './routes/email';
import { apiConfigRoutes } from './routes/apiConfig';
import { syncHolidays } from './services/syncService';
import prisma from './lib/prisma';

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
// In production, uploads are at /app/uploads, in dev at ../uploads relative to dist
const uploadsPath = process.env.NODE_ENV === 'production' 
  ? '/app/uploads' 
  : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/holidays', holidayRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sync-holidays', syncRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/holiday-apis', apiConfigRoutes);

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

// Initialize database and start server
async function startServer() {
  try {
    // Check if admin exists, create or update default admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminExists = await prisma.admin.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminExists) {
      console.log('Creating default admin user...');
      await prisma.admin.create({
        data: {
          username: 'admin',
          password: hashedPassword
        }
      });
      console.log('Default admin created (admin/admin123)');
    } else {
      // Reset password to default on startup (for development)
      await prisma.admin.update({
        where: { username: 'admin' },
        data: { password: hashedPassword }
      });
      console.log('Default admin password reset to admin123');
    }
    
    app.listen(PORT, () => {
      console.log(`MortgagePros Calendar API running on port ${PORT}`);
      console.log(`Holiday sync cron scheduled for 2 AM daily`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
