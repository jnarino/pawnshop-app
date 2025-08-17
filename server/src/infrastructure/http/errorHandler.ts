import { Request, Response, NextFunction } from 'express';
import { AppError, InternalError, NotFoundError } from '../../application/errors';
import { logger } from '../log/logger';

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const appErr: AppError = err instanceof AppError ? err : new InternalError();
  const reqId = (res as any).locals?.requestId;
  if (appErr.httpStatus >= 500) {
    logger.error('unhandled_error', { code: appErr.code, message: err?.message, stack: err?.stack, requestId: reqId });
  }
  const body: any = { error: { code: appErr.code, message: appErr.message } };
  if (process.env.NODE_ENV !== 'production' && appErr.httpStatus >= 500) body.error.stack = err?.stack;
  if ((appErr as any).details) body.error.details = (appErr as any).details;
  res.status(appErr.httpStatus).json(body);
}
