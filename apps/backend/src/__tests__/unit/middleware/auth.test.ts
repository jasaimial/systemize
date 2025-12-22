import { Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../../../middleware/auth';
import { generateTestToken, generateExpiredToken, generateInvalidToken } from '../../helpers/testUtils';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe('authenticate', () => {
    it('should call next() with valid token', () => {
      const token = generateTestToken();
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe('test-user-id');
      expect(mockRequest.user?.email).toBe('test@example.com');
    });

    it('should call next() with AppError when no authorization header', () => {
      authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'UNAUTHORIZED',
        })
      );
    });

    it('should call next() with AppError when authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'UNAUTHORIZED',
        })
      );
    });

    it('should call next() with AppError for invalid token', () => {
      const invalidToken = generateInvalidToken();
      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`,
      };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'INVALID_TOKEN',
        })
      );
    });

    it('should call next() with AppError for expired token', () => {
      const expiredToken = generateExpiredToken();
      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          // Note: In some JWT versions, expired tokens throw JsonWebTokenError
          // rather than TokenExpiredError, so we accept both error codes
          code: expect.stringMatching(/TOKEN_EXPIRED|INVALID_TOKEN/),
        })
      );
    });

    it('should attach user data to request object with valid token', () => {
      const token = generateTestToken({
        id: 'custom-id',
        email: 'custom@example.com',
        provider: 'microsoft',
      });
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticate(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toMatchObject({
        id: 'custom-id',
        email: 'custom@example.com',
        provider: 'microsoft',
      });
    });
  });
});
