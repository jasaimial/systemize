# Backend Initialization Technical Memo

**Date:** December 21, 2025
**Subject:** Initialization of Systemize Backend Service
**Status:** Initial Setup Complete

---

## 1. Executive Summary

This memo documents the initialization and architecture of the backend service for **Systemize**, a gamified productivity platform for middle school students. The backend provides a RESTful API built with Node.js, Express, and TypeScript, designed for deployment on Azure App Service with Azure AD B2C authentication.

**Current Status:** ✅ Core infrastructure complete with 53 passing tests and 79% code coverage.

---

## 2. Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 20+ | JavaScript runtime |
| Framework | Express | 4.18+ | Web framework |
| Language | TypeScript | 5.3+ | Type safety |
| Testing | Jest + Supertest | 29.7+ | Unit & integration testing |
| ORM | Prisma | 5.7+ | Database access (to be configured) |
| Validation | Zod | 3.22+ | Schema validation |
| Auth | JWT + Azure AD B2C | - | Authentication |
| Cache | Redis | 4.6+ | Session & rate limiting (to be configured) |

---

## 3. Project Structure

```
apps/backend/
├── src/
│   ├── config/
│   │   └── env.ts                    # Environment configuration
│   ├── middleware/
│   │   ├── auth.ts                   # JWT authentication
│   │   ├── errorHandler.ts           # Global error handling
│   │   ├── requestLogger.ts          # Request/response logging
│   │   └── rateLimiter.ts            # Rate limiting
│   ├── routes/
│   │   ├── index.ts                  # Route aggregator
│   │   ├── auth.routes.ts            # Auth endpoints
│   │   ├── task.routes.ts            # Task CRUD
│   │   ├── progress.routes.ts        # Gamification (XP, badges)
│   │   └── notification.routes.ts    # Push notifications
│   ├── types/
│   │   └── index.ts                  # TypeScript type definitions
│   ├── __tests__/
│   │   ├── setup.ts                  # Test configuration
│   │   ├── helpers/
│   │   │   └── testUtils.ts          # Test utilities
│   │   ├── unit/
│   │   │   └── middleware/           # Unit tests
│   │   └── integration/              # API integration tests
│   └── index.ts                      # Application entry point
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript config
├── jest.config.js                     # Jest config
├── .env.example                       # Environment template
├── .eslintrc.js                       # Linting rules
├── README.md                          # API documentation
└── TESTING.md                         # Test suite documentation
```

---

## 4. Core Components

### 4.1 Application Entry Point (`src/index.ts`)

**Purpose:** Initializes and configures the Express server.

**Key Features:**
- Security middleware (Helmet, CORS)
- Body parsing (JSON, URL-encoded)
- Request logging
- Rate limiting (100 requests per 15 minutes)
- Global error handling
- Health check endpoint at `/health`
- Graceful shutdown on SIGTERM

**Startup Flow:**
```
1. Load environment variables (dotenv)
2. Initialize Express app
3. Apply security middleware (helmet, CORS)
4. Configure body parsers
5. Attach request logger
6. Attach rate limiter
7. Mount API routes at /api/v1
8. Attach error handler (must be last)
9. Start listening on PORT (default: 3001)
```

### 4.2 Configuration (`src/config/env.ts`)

**Purpose:** Centralized, type-safe environment configuration.

**Configuration Sections:**
- **Server:** `NODE_ENV`, `PORT`, `API_VERSION`
- **Database:** `DATABASE_URL` (Prisma connection string)
- **Redis:** `REDIS_URL`, `REDIS_PASSWORD`
- **JWT:** `JWT_SECRET`, token expiration settings
- **Azure AD B2C:** Tenant, client ID, policy name
- **Azure Services:** Notification Hubs, Communication Services, Storage
- **CORS:** Allowed frontend origin
- **Rate Limiting:** Window duration, max requests

**Usage Example:**
```typescript
import { config } from './config/env';

const port = config.port; // Type-safe access
```

### 4.3 Middleware Layer

#### 4.3.1 Authentication (`middleware/auth.ts`)

**Purpose:** Validates JWT tokens and attaches user context to requests.

**How It Works:**
```
1. Extract Authorization header
2. Verify "Bearer <token>" format
3. Decode and verify JWT signature
4. Attach user payload to req.user
5. Call next() or throw AppError
```

**Usage:**
```typescript
router.get('/protected', authenticate, (req: AuthRequest, res) => {
  const userId = req.user?.id; // User context available
});
```

**Error Codes:**
- `UNAUTHORIZED`: Missing or invalid Authorization header
- `INVALID_TOKEN`: Malformed JWT
- `TOKEN_EXPIRED`: JWT has expired

#### 4.3.2 Error Handler (`middleware/errorHandler.ts`)

**Purpose:** Standardizes error responses across the API.

**Handles:**
1. **AppError** (custom errors): Returns with correct status code
2. **ZodError** (validation): Returns 400 with field-level errors
3. **Generic Error**: Returns 500 with sanitized message

**Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {} // Optional
  },
  "meta": {
    "timestamp": "2025-12-21T10:30:00Z"
  }
}
```

#### 4.3.3 Request Logger (`middleware/requestLogger.ts`)

**Purpose:** Logs all incoming requests and responses for debugging.

**Logs:**
- ➡️ Incoming: Method + Path
- 🟢 Success: Status 2xx-3xx
- 🔴 Error: Status 4xx-5xx
- Response time in milliseconds

#### 4.3.4 Rate Limiter (`middleware/rateLimiter.ts`)

**Purpose:** Prevents API abuse.

**Configuration:**
- Window: 15 minutes (configurable)
- Max Requests: 100 per window per IP (configurable)
- Returns: 429 Too Many Requests when exceeded

### 4.4 Routing Architecture

#### 4.4.1 Route Structure

All routes are mounted at `/api/v1/` with the following hierarchy:

```
/api/v1/
├── /                           # API documentation
├── /auth
│   ├── POST /signup            # User registration
│   ├── POST /login             # User login
│   ├── POST /logout            # User logout (protected)
│   ├── GET /me                 # Get current user (protected)
│   └── POST /refresh           # Refresh token
├── /tasks                      # All protected
│   ├── GET /                   # List all tasks
│   ├── POST /                  # Create task
│   ├── GET /upcoming           # Tasks due in next 7 days
│   ├── GET /overdue            # Past due date tasks
│   ├── GET /:id                # Get single task
│   ├── PUT /:id                # Update task
│   ├── DELETE /:id             # Delete task
│   └── POST /:id/complete      # Mark as complete
├── /progress                   # All protected
│   ├── GET /                   # User XP, level, streaks
│   ├── GET /badges             # Earned badges
│   └── GET /stats              # Completion statistics
└── /notifications              # All protected
    ├── GET /                   # List notifications
    ├── POST /register          # Register device token
    ├── PUT /:id/read           # Mark as read
    └── DELETE /:id             # Delete notification
```

#### 4.4.2 Current Implementation Status

**✅ Fully Implemented:**
- Routing infrastructure
- Authentication guards
- Placeholder responses
- Error handling

**⏳ To Be Implemented:**
- Database integration (Prisma)
- Business logic in controllers
- Azure AD B2C OAuth flow
- Validation schemas (Zod)
- Service layer

### 4.5 Type System (`src/types/index.ts`)

**Purpose:** Shared TypeScript types for type safety.

**Key Types:**
```typescript
// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: { timestamp: string; version?: string };
}

// Enums
enum TaskCategory { HOMEWORK, PROJECT, TEST, QUIZ, LOST_ITEM, PERSONAL }
enum Priority { LOW, MEDIUM, HIGH }
enum TaskStatus { PENDING, COMPLETED, OVERDUE }

// Domain models (matching future Prisma schema)
interface Task { ... }
interface User { ... }
interface UserProgress { ... }
interface Badge { ... }
```

---

## 5. Testing Infrastructure

### 5.1 Test Suite Overview

**Framework:** Jest + Supertest
**Total Tests:** 53
**Status:** ✅ All passing
**Coverage:** 79.28% overall

**Test Distribution:**
- Unit tests: 12 tests (middleware)
- Integration tests: 41 tests (API routes)

### 5.2 Test Categories

#### Unit Tests (12 tests)
- **Authentication Middleware** (6 tests):
  - Valid token handling
  - Missing/invalid token rejection
  - Expired token handling
  - User data extraction

- **Error Handler Middleware** (6 tests):
  - AppError formatting
  - Zod validation errors
  - Generic error handling
  - Environment-specific messages

#### Integration Tests (41 tests)
- **Health Check** (7 tests): Server status endpoint
- **API Root** (5 tests): Documentation endpoint
- **Auth Routes** (7 tests): Authentication flow
- **Task Routes** (10 tests): Task CRUD operations
- **Progress Routes** (6 tests): Gamification data
- **Notification Routes** (6 tests): Push notifications

### 5.3 Test Utilities

**Location:** `src/__tests__/helpers/testUtils.ts`

**Key Functions:**
```typescript
// Generate valid JWT for testing
generateTestToken(payload?: { id?, email?, provider? })

// Generate expired JWT
generateExpiredToken()

// Generate malformed JWT
generateInvalidToken()

// Mock data
mockUser, mockTask, mockProgress
```

---

## 6. Local Development Guide

### 6.1 Prerequisites

Before you begin, ensure you have:
- ✅ Node.js 20+ installed (`node -v`)
- ✅ pnpm installed (`pnpm -v`)
- ✅ Basic understanding of Express and TypeScript

### 6.2 Initial Setup

```bash
# 1. Navigate to backend directory
cd apps/backend

# 2. Install dependencies
pnpm install

# 3. Create environment file
cp .env.example .env

# 4. (Optional) Edit .env for custom configuration
# Defaults work for local development
```

### 6.3 Running the Development Server

```bash
# Start server with hot-reload
pnpm dev

# Expected output:
# 🚀 Systemize API server running on port 3001
# 📝 Environment: development
# 🔗 Health check: http://localhost:3001/health
```

**Verify Server:**
```bash
curl http://localhost:3001/health
# Should return: {"success":true,"message":"Systemize API is running",...}
```

### 6.4 Running Tests

```bash
# Run all tests once
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run tests in watch mode (recommended for development)
pnpm test:watch

# Run tests for CI/CD
pnpm test:ci
```

**Understanding Test Output:**
```
✅ Green checkmarks: Passing tests
❌ Red X: Failing tests
Coverage report shows which files/lines are tested
```

### 6.5 Building for Production

```bash
# Compile TypeScript to JavaScript
pnpm build

# Output: dist/ directory with compiled .js files

# Run production build
pnpm start
```

### 6.6 Common Development Tasks

#### Testing an Endpoint

```bash
# Without authentication
curl http://localhost:3001/api/v1/auth/login

# With authentication (after implementing auth)
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/v1/tasks
```

#### Checking for TypeScript Errors

```bash
# Type checking without compilation
npx tsc --noEmit
```

#### Linting Code

```bash
pnpm lint
```

---

## 7. Debugging Guide

### 7.1 VS Code Debugging Setup

Create `.vscode/launch.json` in the workspace root:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/apps/backend/src/index.ts",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/tsx",
      "runtimeArgs": ["watch"],
      "cwd": "${workspaceFolder}/apps/backend",
      "envFile": "${workspaceFolder}/apps/backend/.env",
      "console": "integratedTerminal",
      "restart": true
    }
  ]
}
```

**How to Use:**
1. Set breakpoints in your code (click left of line numbers)
2. Press F5 or click "Run and Debug"
3. Server starts with debugger attached
4. Make requests to trigger breakpoints

### 7.2 Debugging Tests

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "cwd": "${workspaceFolder}/apps/backend",
  "console": "integratedTerminal"
}
```

### 7.3 Common Issues & Solutions

#### Issue: Port 3001 already in use
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
PORT=3002
```

#### Issue: Tests hanging
```bash
# Clear Jest cache
pnpm test --clearCache

# Check for open handles
pnpm test --detectOpenHandles
```

#### Issue: Module not found
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

#### Issue: TypeScript errors
```bash
# Regenerate types
npx tsc --noEmit

# Check tsconfig.json is correct
```

---

## 8. API Testing with Tools

### 8.1 Using cURL

```bash
# Health check
curl http://localhost:3001/health

# API root (documentation)
curl http://localhost:3001/api/v1/

# Protected endpoint (will return 401)
curl http://localhost:3001/api/v1/tasks
```

### 8.2 Using Postman/Insomnia

**Import Collection:**
1. Create new request
2. Set base URL: `http://localhost:3001`
3. Add environment variable for auth token

**Example Authenticated Request:**
```
GET http://localhost:3001/api/v1/tasks
Headers:
  Authorization: Bearer <your-jwt-token>
```

### 8.3 Using Thunder Client (VS Code Extension)

1. Install Thunder Client extension
2. Create new request
3. Save to collection for reuse

---

## 9. Architecture Decisions

### 9.1 Why Express?
- ✅ Mature, battle-tested framework
- ✅ Large ecosystem of middleware
- ✅ Flexible and unopinionated
- ✅ Easy to understand for new developers

### 9.2 Why TypeScript?
- ✅ Catch errors at compile-time
- ✅ Better IDE support (autocomplete, refactoring)
- ✅ Self-documenting code with types
- ✅ Share types between frontend/backend

### 9.3 Why Layered Architecture?
```
Request → Routes → Middleware → Controllers → Services → Repositories → Database
```
- ✅ Separation of concerns
- ✅ Easy to test individual layers
- ✅ Scalable as complexity grows
- ✅ Clear data flow

### 9.4 Why JWT for Auth?
- ✅ Stateless (no session storage needed)
- ✅ Works across distributed systems
- ✅ Industry standard
- ✅ Azure AD B2C provides JWTs

---

## 10. Next Steps for Developers

### 10.1 Immediate Tasks (Required for MVP)

1. **Database Setup**
   - [ ] Design Prisma schema (see `TECHNICAL_SPEC.md`)
   - [ ] Set up local PostgreSQL database
   - [ ] Run Prisma migrations
   - [ ] Generate Prisma client

2. **Authentication Implementation**
   - [ ] Integrate Azure AD B2C
   - [ ] Implement OAuth callback flow
   - [ ] Create JWT signing/verification logic
   - [ ] Update auth routes with real logic

3. **Task Management**
   - [ ] Create TaskController
   - [ ] Implement CRUD operations
   - [ ] Add Zod validation schemas
   - [ ] Connect to Prisma models

4. **Gamification System**
   - [ ] Implement XP calculation logic
   - [ ] Create badge award system
   - [ ] Build streak tracking
   - [ ] Level progression algorithm

5. **Notification System**
   - [ ] Set up Azure Notification Hubs
   - [ ] Create notification scheduling service
   - [ ] Implement push notification sending

### 10.2 Testing Requirements

As you implement features:
- ✅ Update existing test placeholders
- ✅ Add new tests for business logic
- ✅ Maintain >80% code coverage
- ✅ Test edge cases and error scenarios

### 10.3 Documentation Updates

Keep documentation in sync:
- Update `README.md` with new endpoints
- Add JSDoc comments to functions
- Update this memo with architectural changes

---

## 11. Resources & References

### 11.1 Internal Documentation
- [Product Specification](./PRODUCT_SPEC.md)
- [Technical Specification](./TECHNICAL_SPEC.md)
- [Backend README](../apps/backend/README.md)
- [Testing Guide](../apps/backend/TESTING.md)

### 11.2 External Resources
- [Express Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/)

### 11.3 Useful Commands Cheat Sheet

```bash
# Development
pnpm dev              # Start dev server
pnpm test:watch       # Run tests in watch mode

# Testing
pnpm test             # Run all tests
pnpm test:coverage    # With coverage report

# Building
pnpm build            # Compile TypeScript
pnpm start            # Run production build

# Maintenance
pnpm lint             # Check code style
npx tsc --noEmit      # Type check only
```

---

## 12. Support & Contributions

### 12.1 Getting Help

If you encounter issues:
1. Check this memo for common solutions
2. Review test files for usage examples
3. Check TypeScript errors carefully
4. Review logs for error details

### 12.2 Code Standards

- Use TypeScript strict mode
- Follow existing file structure
- Write tests for new features
- Use meaningful variable names
- Add JSDoc comments for complex functions

---

**End of Memo**

*Last Updated: December 21, 2025*
*Next Review: After database implementation*
