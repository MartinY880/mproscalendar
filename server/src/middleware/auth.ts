/**
 * JWT Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

// JWT payload interface
interface JWTPayload {
  id: number;
  username: string;
}

/**
 * Middleware to verify JWT token
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'mortgagepros-secret-key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Generate JWT token for admin user
 */
export const generateToken = (user: { id: number; username: string }): string => {
  const secret = process.env.JWT_SECRET || 'mortgagepros-secret-key';
  const expiresInHours = parseInt(process.env.JWT_EXPIRES_IN || '24', 10);
  
  return jwt.sign(
    { id: user.id, username: user.username },
    secret,
    { expiresIn: expiresInHours * 60 * 60 } // Convert hours to seconds
  );
};
