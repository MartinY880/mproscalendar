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
// In production, uploads are at /app/uploads, in dev at ../../uploads relative to dist
const uploadsDir = process.env.NODE_ENV === 'production' 
  ? '/app/uploads' 
  : path.join(__dirname, '../../uploads');
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
 * Get current logo URL (stored as base64 data URL in database)
 */
router.get('/logo', async (_req: Request, res: Response): Promise<void> => {
  try {
    const logoSetting = await prisma.settings.findUnique({
      where: { key: 'logoDataUrl' }
    });

    if (logoSetting && logoSetting.value) {
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
 * GET /api/settings/logo/image
 * Serve the actual logo image file
 */
router.get('/logo/image', async (_req: Request, res: Response): Promise<void> => {
  try {
    const logoSetting = await prisma.settings.findUnique({
      where: { key: 'logoUrl' }
    });

    if (!logoSetting) {
      res.status(404).json({ error: 'No logo found' });
      return;
    }

    // Extract filename from stored URL (e.g., /uploads/logo.png -> logo.png)
    const filename = logoSetting.value.replace('/uploads/', '');
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Logo file not found' });
      return;
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Get logo image error:', error);
    res.status(500).json({ error: 'Failed to fetch logo image' });
  }
});

/**
 * POST /api/settings/logo
 * Upload new logo (admin only) - stores as base64 in database
 */
router.post('/logo', authMiddleware, upload.single('logo'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Read the file and convert to base64 data URL
    const filePath = path.join(uploadsDir, req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(req.file.filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'image/png';
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Store the base64 data URL directly in database
    await prisma.settings.upsert({
      where: { key: 'logoDataUrl' },
      update: { value: dataUrl },
      create: { key: 'logoDataUrl', value: dataUrl }
    });

    // Clean up the temporary file
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors
    }

    res.json({ 
      message: 'Logo uploaded successfully',
      logoUrl: dataUrl
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
    // Delete the logo data URL from database
    await prisma.settings.deleteMany({
      where: { 
        key: { in: ['logoDataUrl', 'logoUrl'] }
      }
    });

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
