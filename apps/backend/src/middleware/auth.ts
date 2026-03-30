import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from './errorHandler';
import prisma from '../lib/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    provider: string;
  };
}

// Cache of user IDs we've already ensured exist in the DB
const knownUsers = new Set<string>();

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      provider: string;
    };

    // Only upsert once per server lifetime per user
    if (!knownUsers.has(decoded.id)) {
      await prisma.user.upsert({
        where: { id: decoded.id },
        update: {},
        create: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.email.split('@')[0],
          provider: decoded.provider,
          providerId: `${decoded.provider}-${decoded.id}`,
        },
      });
      knownUsers.add(decoded.id);
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token', 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expired', 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};
