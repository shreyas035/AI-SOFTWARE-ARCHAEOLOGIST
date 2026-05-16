import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { prisma } from '../config/database';
import logger from '../config/logger';

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    // Attach user to request object
    req.user = user as any;

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      logger.warn('Authentication failed', { error: error.message });
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
      return;
    }

    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token', { error: error.message });
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    if (error instanceof Error && error.name === 'TokenExpiredError') {
      logger.warn('Token expired');
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    logger.error('Authentication error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      });
      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      req.user = user as any;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// Made with Bob
