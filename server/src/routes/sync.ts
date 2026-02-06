/**
 * Sync Routes
 * Manual sync trigger and sync logs
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { syncHolidays, getSyncLogs } from '../services/syncService';

const router = Router();

/**
 * POST /api/sync-holidays
 * Trigger manual holiday sync (admin only)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year } = req.body;
    
    console.log('[API] Manual sync triggered by admin');
    
    const result = await syncHolidays(year ? parseInt(year, 10) : undefined);

    res.json({
      message: 'Holiday sync completed successfully',
      synced: result
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync holidays' });
  }
});

/**
 * GET /api/sync-holidays/logs
 * Get sync logs (admin only)
 */
router.get('/logs', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const logs = await getSyncLogs(limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Get sync logs error:', error);
    res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
});

export { router as syncRoutes };
