import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ForbiddenError, NotFoundError } from '../../../application/common/errors';
import { InvalidCredentialsError, InvalidRefreshTokenError } from '../../../application/service/AuthService';
import { logger } from '../../../infrastructure/logger';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', issues: err.issues });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({ message: err.message });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ message: err.message });
  }

  if (err instanceof InvalidCredentialsError || err instanceof InvalidRefreshTokenError) {
    return res.status(401).json({ message: err.message });
  }

  logger.error('Unhandled error', err);
  return res.status(500).json({ message: 'Internal server error' });
}
