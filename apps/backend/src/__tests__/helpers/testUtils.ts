import jwt from 'jsonwebtoken';
import { config } from '../../config/env';

/**
 * Generate a valid JWT token for testing authenticated endpoints
 */
export const generateTestToken = (payload: {
  id?: string;
  email?: string;
  provider?: string;
} = {}) => {
  const defaultPayload = {
    id: payload.id || 'test-user-id',
    email: payload.email || 'test@example.com',
    provider: payload.provider || 'google',
  };

  return jwt.sign(defaultPayload, config.jwtSecret, { expiresIn: '1h' });
};

/**
 * Generate an expired JWT token for testing token expiration
 */
export const generateExpiredToken = () => {
  return jwt.sign(
    {
      id: 'test-user-id',
      email: 'test@example.com',
      provider: 'google',
    },
    config.jwtSecret,
    { expiresIn: '-1h' } // Already expired
  );
};

/**
 * Generate an invalid JWT token
 */
export const generateInvalidToken = () => {
  return 'invalid.jwt.token';
};

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  provider: 'google',
  providerId: 'google-123',
};

/**
 * Mock task data for testing
 */
export const mockTask = {
  id: 'task-123',
  userId: 'test-user-123',
  title: 'Complete math homework',
  description: 'Chapter 5 exercises',
  dueDate: new Date('2025-12-20'),
  category: 'HOMEWORK',
  priority: 'HIGH',
  status: 'PENDING',
  subject: 'Mathematics',
  xpAwarded: 0,
};

/**
 * Mock progress data for testing
 */
export const mockProgress = {
  id: 'progress-123',
  userId: 'test-user-123',
  totalXP: 500,
  currentLevel: 2,
  currentStreak: 5,
  longestStreak: 10,
  lastActivityAt: new Date(),
};
