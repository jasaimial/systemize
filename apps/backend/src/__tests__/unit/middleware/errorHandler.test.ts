import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, errorHandler } from '../../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {};
    mockResponse = {
      status: statusMock,
    };
    mockNext = jest.fn();

    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppError handling', () => {
    it('should handle AppError with correct status code', () => {
      const error = new AppError(404, 'Resource not found', 'NOT_FOUND');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            message: 'Resource not found',
          }),
        })
      );
    });

    it('should include error details if provided', () => {
      const error = new AppError(400, 'Invalid input', 'VALIDATION_ERROR', {
        field: 'email',
        issue: 'invalid format',
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: { field: 'email', issue: 'invalid format' },
          }),
        })
      );
    });
  });

  describe('Zod validation error handling', () => {
    it('should handle ZodError and return 400 status', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(0),
      });

      try {
        schema.parse({ email: 'invalid', age: -5 });
      } catch (error) {
        errorHandler(error as Error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: expect.arrayContaining([
                expect.objectContaining({
                  field: expect.any(String),
                  message: expect.any(String),
                }),
              ]),
            }),
          })
        );
      }
    });
  });

  describe('Generic error handling', () => {
    it('should handle generic Error with 500 status in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should include error message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Detailed error message');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Detailed error message',
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should include timestamp in response', () => {
      const error = new AppError(500, 'Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            timestamp: expect.any(String),
          }),
        })
      );
    });
  });
});
