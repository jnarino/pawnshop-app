import { Request, Response, NextFunction } from 'express';
import { logger } from '../log/logger';

export function accessLog(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const id = (req as any).requestId;
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info('req', { id, method: req.method, path: req.originalUrl, status: res.statusCode, ms });
  });
  next();
}
