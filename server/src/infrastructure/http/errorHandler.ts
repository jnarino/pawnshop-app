import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, NotFoundError, InternalError } from '../../application/errors';
import { logger } from '../log/logger';

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  let appErr: AppError;
  if (err instanceof AppError) appErr = err;
  else if (err instanceof ValidationError) appErr = err;
  else if (err instanceof NotFoundError) appErr = err;
  else {
    appErr = new InternalError();
  }
  if (appErr.httpStatus >= 500) {
    logger.error('unhandled_error', { code: appErr.code, message: err?.message, stack: err?.stack });
  }
  const body: any = { error: { code: appErr.code, message: appErr.message } };
  if (process.env.NODE_ENV === 'development' && appErr.httpStatus >= 500) body.error.stack = err?.stack;
  if (appErr.details) body.error.details = appErr.details;
  res.status(appErr.httpStatus).json(body);
}
