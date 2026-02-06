/**
 * Holiday Routes
 * CRUD operations for holidays
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Holiday type definition
interface HolidayInput {
  title: string;
  date: string;
  category: string;
  color?: string;
  source?: string;
  visible?: boolean;
  recurring?: boolean;
}

/**
 * GET /api/holidays
 * Get all holidays (public endpoint for employees)
 * Query params: year, category, includeHidden (admin only)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, category, includeHidden } = req.query;

    // Build where clause
    const where: {
      date?: { startsWith: string };
      category?: string;
      visible?: boolean;
    } = {};

    // Filter by year if provided
    if (year && typeof year === 'string') {
      where.date = { startsWith: year };
    }

    // Filter by category if provided
    if (category && typeof category === 'string') {
      where.category = category;
    }

    // Only show visible holidays unless includeHidden is true (admin)
    if (includeHidden !== 'true') {
      where.visible = true;
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    res.json(holidays);
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

/**
 * GET /api/holidays/:id
 * Get single holiday by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const holiday = await prisma.holiday.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!holiday) {
      res.status(404).json({ error: 'Holiday not found' });
      return;
    }

    res.json(holiday);
  } catch (error) {
    console.error('Get holiday error:', error);
    res.status(500).json({ error: 'Failed to fetch holiday' });
  }
});

/**
 * POST /api/holidays
 * Create new holiday (admin only)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, date, category, color, source, visible, recurring }: HolidayInput = req.body;

    if (!title || !date || !category) {
      res.status(400).json({ error: 'Title, date, and category are required' });
      return;
    }

    const holiday = await prisma.holiday.create({
      data: {
        title,
        date,
        category,
        color: color || '#06427F',
        source: source || 'custom',
        visible: visible !== undefined ? visible : true,
        recurring: recurring || false
      }
    });

    res.status(201).json(holiday);
  } catch (error) {
    console.error('Create holiday error:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

/**
 * PUT /api/holidays/:id
 * Update holiday (admin only)
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, date, category, color, visible, recurring }: Partial<HolidayInput> = req.body;

    const existingHoliday = await prisma.holiday.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!existingHoliday) {
      res.status(404).json({ error: 'Holiday not found' });
      return;
    }

    const holiday = await prisma.holiday.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date }),
        ...(category !== undefined && { category }),
        ...(color !== undefined && { color }),
        ...(visible !== undefined && { visible }),
        ...(recurring !== undefined && { recurring })
      }
    });

    res.json(holiday);
  } catch (error) {
    console.error('Update holiday error:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
});

/**
 * DELETE /api/holidays/:id
 * Delete holiday (admin only)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingHoliday = await prisma.holiday.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!existingHoliday) {
      res.status(404).json({ error: 'Holiday not found' });
      return;
    }

    await prisma.holiday.delete({
      where: { id: parseInt(id, 10) }
    });

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

/**
 * DELETE /api/holidays/bulk/all
 * Delete all holidays (admin only)
 */
router.delete('/bulk/all', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.holiday.deleteMany({});
    res.json({ message: `Deleted ${result.count} holidays` });
  } catch (error) {
    console.error('Delete all holidays error:', error);
    res.status(500).json({ error: 'Failed to delete holidays' });
  }
});

/**
 * DELETE /api/holidays/bulk/source/:source
 * Delete all holidays by source (admin only)
 */
router.delete('/bulk/source/:source', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { source } = req.params;
    
    if (!['federal', 'fun', 'custom'].includes(source)) {
      res.status(400).json({ error: 'Invalid source. Must be: federal, fun, or custom' });
      return;
    }

    const result = await prisma.holiday.deleteMany({
      where: { source }
    });
    
    res.json({ message: `Deleted ${result.count} ${source} holidays` });
  } catch (error) {
    console.error('Delete holidays by source error:', error);
    res.status(500).json({ error: 'Failed to delete holidays' });
  }
});

/**
 * PATCH /api/holidays/:id/visibility
 * Toggle holiday visibility (admin only)
 */
router.patch('/:id/visibility', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { visible } = req.body;

    if (visible === undefined) {
      res.status(400).json({ error: 'Visible field is required' });
      return;
    }

    const holiday = await prisma.holiday.update({
      where: { id: parseInt(id, 10) },
      data: { visible }
    });

    res.json(holiday);
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ error: 'Failed to toggle visibility' });
  }
});

/**
 * GET /api/holidays/stats/summary
 * Get holiday statistics (admin dashboard)
 */
router.get('/stats/summary', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear().toString();

    const [total, federal, fun, company, hidden] = await Promise.all([
      prisma.holiday.count({ where: { date: { startsWith: currentYear } } }),
      prisma.holiday.count({ where: { date: { startsWith: currentYear }, category: 'federal' } }),
      prisma.holiday.count({ where: { date: { startsWith: currentYear }, category: 'fun' } }),
      prisma.holiday.count({ where: { date: { startsWith: currentYear }, category: 'company' } }),
      prisma.holiday.count({ where: { date: { startsWith: currentYear }, visible: false } })
    ]);

    res.json({
      total,
      federal,
      fun,
      company,
      hidden,
      year: currentYear
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export { router as holidayRoutes };
