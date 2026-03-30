import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    provider: string;
  };
}

/**
 * JWT authentication middleware.
 * Validates the Bearer token and attaches decoded user to req.user.
 * User must already exist in the database (created via POST /auth/login).
 */
export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      provider: string;
    };

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
