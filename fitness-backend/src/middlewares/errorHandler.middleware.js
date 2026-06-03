import { ZodError } from 'zod';
import logger from '../utils/logger.util.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { path: req.path, stack: env.NODE_ENV === 'development' ? err.stack : undefined });

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', statusCode: 400, details: err.errors },
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: 'Resource already exists', statusCode: 409 },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const code = (typeof err.code === 'string' && err.code) || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'Internal server error',
      statusCode,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
