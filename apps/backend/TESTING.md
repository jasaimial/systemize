# Backend Test Suite Documentation

## Overview
Comprehensive test suite for the Systemize backend API with 53 passing tests achieving ~79% code coverage.

## Test Structure

```
src/__tests__/
├── setup.ts                          # Test configuration
├── helpers/
│   └── testUtils.ts                  # Test utilities & mock data
├── unit/
│   └── middleware/
│       ├── auth.test.ts              # Authentication middleware tests (6 tests)
│       └── errorHandler.test.ts      # Error handling tests (6 tests)
└── integration/
    ├── health.test.ts                # Health check endpoint tests (7 tests)
    ├── api-root.test.ts              # API root endpoint tests (5 tests)
    ├── auth-routes.test.ts           # Auth route tests (7 tests)
    ├── task-routes.test.ts           # Task route tests (10 tests)
    ├── progress-routes.test.ts       # Progress route tests (6 tests)
    └── notification-routes.test.ts   # Notification route tests (6 tests)
```

## Coverage Report

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| **All files** | 79.28% | 80.3% | 80% | 79.56% |
| config/env.ts | 100% | 90.9% | 100% | 100% |
| middleware/auth.ts | 94.44% | 85.71% | 100% | 94.11% |
| middleware/errorHandler.ts | 100% | 100% | 100% | 100% |
| routes/*.ts | 98.61% | 100% | 95.23% | 98.61% |

## Test Categories

### 1. Unit Tests (12 tests)

#### Authentication Middleware (`auth.test.ts`)
- ✅ Valid token authentication
- ✅ Missing authorization header rejection
- ✅ Invalid Bearer format rejection
- ✅ Invalid token rejection
- ✅ Expired token rejection
- ✅ User data extraction from JWT

#### Error Handler Middleware (`errorHandler.test.ts`)
- ✅ AppError handling with correct status codes
- ✅ Error details inclusion
- ✅ Zod validation error formatting
- ✅ Generic error handling in production
- ✅ Error message exposure in development
- ✅ Timestamp inclusion in all error responses

### 2. Integration Tests (41 tests)

#### Health Check (`health.test.ts`)
Tests the `/health` endpoint functionality:
- ✅ Returns 200 status
- ✅ Returns success flag
- ✅ Includes API version and environment
- ✅ Contains valid timestamp
- ✅ Correct content-type header

#### API Root (`api-root.test.ts`)
Tests the `/api/v1/` documentation endpoint:
- ✅ Returns available endpoints
- ✅ Includes version information
- ✅ Proper JSON response format

#### Auth Routes (`auth-routes.test.ts`)
Tests authentication endpoints:
- ✅ Signup endpoint (placeholder)
- ✅ Login endpoint (placeholder)
- ✅ Logout requires authentication
- ✅ Get current user requires authentication
- ✅ Token refresh endpoint (placeholder)

#### Task Routes (`task-routes.test.ts`)
Tests task management endpoints:
- ✅ All routes require authentication
- ✅ List tasks (GET /tasks)
- ✅ Create task (POST /tasks)
- ✅ Get single task (GET /tasks/:id)
- ✅ Update task (PUT /tasks/:id)
- ✅ Delete task (DELETE /tasks/:id)
- ✅ Complete task (POST /tasks/:id/complete)
- ✅ Get upcoming tasks
- ✅ Get overdue tasks

#### Progress Routes (`progress-routes.test.ts`)
Tests gamification/progress endpoints:
- ✅ All routes require authentication
- ✅ Get user progress (XP, level, streaks)
- ✅ Get earned badges
- ✅ Get completion statistics

#### Notification Routes (`notification-routes.test.ts`)
Tests notification endpoints:
- ✅ All routes require authentication
- ✅ List notifications
- ✅ Register device for push notifications
- ✅ Mark notification as read
- ✅ Delete notification

## Test Utilities

### Helper Functions (`testUtils.ts`)

```typescript
// Generate valid JWT token for testing
generateTestToken(payload?: { id?, email?, provider? })

// Generate expired JWT token
generateExpiredToken()

// Generate invalid JWT token
generateInvalidToken()
```

### Mock Data
- `mockUser` - Sample user object
- `mockTask` - Sample task object
- `mockProgress` - Sample progress object

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode
pnpm test:ci
```

## Test Configuration

### Jest Config (`jest.config.js`)
- **Test Environment**: Node.js
- **Test Match**: `**/*.test.ts`
- **Coverage Threshold**: Not enforced yet
- **Timeout**: 10 seconds for integration tests

### Test Setup (`setup.ts`)
- Sets `NODE_ENV=test`
- Configures test JWT secret
- Sets up test environment variables

## Adding New Tests

### Example: Testing a New Route

```typescript
import request from 'supertest';
import express from 'express';
import routes from '../../routes';
import { config } from '../../config/env';
import { generateTestToken } from '../helpers/testUtils';
import { errorHandler } from '../../middleware/errorHandler';

describe('New Route', () => {
  let app: express.Application;
  let validToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(`/api/${config.apiVersion}`, routes);
    app.use(errorHandler);
    validToken = generateTestToken();
  });

  it('should work with authentication', async () => {
    const response = await request(app)
      .get('/api/v1/new-route')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Best Practices

1. **Always include error handler**: Integration tests should use `errorHandler` middleware
2. **Test authentication**: Test both authenticated and unauthenticated access
3. **Use test utilities**: Leverage helper functions for token generation
4. **Mock external services**: When implementing real APIs, mock external dependencies
5. **Test edge cases**: Invalid inputs, expired tokens, missing data
6. **Descriptive test names**: Use clear, action-oriented test descriptions

## Current Status

✅ **53/53 tests passing**
✅ **79% code coverage**
✅ **All critical paths tested**
⏳ **Ready for API implementation**

## Next Steps

As you implement actual API functionality:

1. Update placeholder routes with real logic
2. Add database integration tests (with test database)
3. Add validation schema tests
4. Add service layer tests
5. Test gamification calculations
6. Test notification scheduling
7. Add E2E tests for complete user flows

## Notes

- Middleware tests use direct function calls (unit tests)
- Route tests use `supertest` for HTTP requests (integration tests)
- Tests are isolated and can run in any order
- No database required for current test suite (placeholders only)
