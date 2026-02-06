/**
 * Authentication Routes
 * Handles admin login/logout
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Admin login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken({ id: admin.id, username: admin.username });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated admin
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, createdAt: true }
    });

    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    res.json(admin);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/change-password
 * Change admin password
 */
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' });
      return;
    }

    // Get admin
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id }
    });

    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.password);

    if (!isValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.admin.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as authRoutes };
