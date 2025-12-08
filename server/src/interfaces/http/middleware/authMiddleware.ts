import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AuthenticatedUser = {
  id: string;
  username: string;
  role: string;
  sessionId: string;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(jwtSecret: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing authorization header' });
    }

    const token = header.substring('Bearer '.length);

    try {
      const payload = jwt.verify(token, jwtSecret) as {
        sub: string;
        sid: string;
        username: string;
        role: string;
      };

      req.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        sessionId: payload.sid
      };

      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}
