import jsonwebtoken from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { jwt as jwtConfig } from '../../../config';

export interface AuthPayload {
  sub: string; // user_id
  username: string;
  roles: string[];
}

export const validateJwt = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jsonwebtoken.verify(token, jwtConfig.accessSecret) as AuthPayload;
    (req as any).auth = { payload };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
};

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = (req as any).auth?.payload?.roles as string[] | undefined;
    if (Array.isArray(roles) && roles.includes(role)) return next();
    return res.status(403).json({ error: 'forbidden', message: 'Insufficient role' });
  };
}
