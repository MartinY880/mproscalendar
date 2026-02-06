/**
 * Settings Routes
 * App settings including logo upload
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for logo upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Always save as logo with extension
    const ext = path.extname(file.originalname);
    cb(null, `logo${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow only images
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, SVG, and WebP are allowed.'));
    }
  }
});

/**
 * GET /api/settings
 * Get all settings (public, for logo etc.)
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.settings.findMany();
    
    // Convert to object
    const settingsObj: Record<string, string> = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * GET /api/settings/logo
 * Get current logo URL
 */
router.get('/logo', async (_req: Request, res: Response): Promise<void> => {
  try {
    const logoSetting = await prisma.settings.findUnique({
      where: { key: 'logoUrl' }
    });

    if (logoSetting) {
      res.json({ logoUrl: logoSetting.value });
    } else {
      res.json({ logoUrl: null });
    }
  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({ error: 'Failed to fetch logo' });
  }
});

/**
 * POST /api/settings/logo
 * Upload new logo (admin only)
 */
router.post('/logo', authMiddleware, upload.single('logo'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    // Update or create logo setting
    await prisma.settings.upsert({
      where: { key: 'logoUrl' },
      update: { value: logoUrl },
      create: { key: 'logoUrl', value: logoUrl }
    });

    res.json({ 
      message: 'Logo uploaded successfully',
      logoUrl 
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

/**
 * DELETE /api/settings/logo
 * Remove logo (admin only)
 */
router.delete('/logo', authMiddleware, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get current logo
    const logoSetting = await prisma.settings.findUnique({
      where: { key: 'logoUrl' }
    });

    if (logoSetting) {
      // Delete file if exists
      const filePath = path.join(__dirname, '../..', logoSetting.value);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove setting
      await prisma.settings.delete({
        where: { key: 'logoUrl' }
      });
    }

    res.json({ message: 'Logo removed successfully' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ error: 'Failed to delete logo' });
  }
});

/**
 * PUT /api/settings/:key
 * Update a setting (admin only)
 */
router.put('/:key', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    res.json(setting);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export { router as settingsRoutes };
