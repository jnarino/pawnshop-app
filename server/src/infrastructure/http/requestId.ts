import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers[REQUEST_ID_HEADER] as string) || crypto.randomUUID();
  (req as any).requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
