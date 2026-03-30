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

    // Ensure user exists in database (auto-create for dev tokens)
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
