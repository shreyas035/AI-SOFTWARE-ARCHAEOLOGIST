import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(err, res);
    return;
  }

  // Handle validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Invalid data provided',
    });
    return;
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: err.message,
    };

    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle multer errors
  if (err.name === 'MulterError') {
    handleMulterError(err, res);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack,
    }),
  });
};

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, res: Response): void {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      res.status(409).json({
        success: false,
        error: 'Resource already exists',
        field: (err.meta?.target as string[])?.join(', '),
      });
      break;

    case 'P2025':
      // Record not found
      res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
      break;

    case 'P2003':
      // Foreign key constraint violation
      res.status(400).json({
        success: false,
        error: 'Invalid reference',
      });
      break;

    default:
      res.status(500).json({
        success: false,
        error: 'Database error',
        ...(process.env.NODE_ENV === 'development' && {
          code: err.code,
          message: err.message,
        }),
      });
  }
}

/**
 * Handle Multer-specific errors
 */
function handleMulterError(err: any, res: Response): void {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: 'File too large',
      maxSize: err.limit,
    });
    return;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    res.status(400).json({
      success: false,
      error: 'Too many files',
    });
    return;
  }

  res.status(400).json({
    success: false,
    error: err.message || 'File upload error',
  });
}

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Made with Bob
