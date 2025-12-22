# Systemize Backend API

Express.js backend API server for the Systemize productivity platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis
- **Authentication**: Azure AD B2C (OAuth 2.0)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (local or Azure)
- Redis (local or Azure)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### Development

```bash
# Run in development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

### Database Setup (Prisma)

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Open Prisma Studio
pnpm prisma:studio
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── routes/         # API route definitions
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Helper functions
└── index.ts        # Application entry point
```

## API Endpoints

### Health Check
- `GET /health` - API health status

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh access token

### Tasks
- `GET /api/v1/tasks` - List all tasks
- `POST /api/v1/tasks` - Create new task
- `GET /api/v1/tasks/:id` - Get task by ID
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task
- `POST /api/v1/tasks/:id/complete` - Mark task as complete
- `GET /api/v1/tasks/upcoming` - Get upcoming tasks
- `GET /api/v1/tasks/overdue` - Get overdue tasks

### Progress
- `GET /api/v1/progress` - Get user progress (XP, level, streaks)
- `GET /api/v1/progress/badges` - Get earned badges
- `GET /api/v1/progress/stats` - Get completion statistics

### Notifications
- `GET /api/v1/notifications` - List notifications
- `POST /api/v1/notifications/register` - Register device for push notifications
- `PUT /api/v1/notifications/:id/read` - Mark notification as read
- `DELETE /api/v1/notifications/:id` - Delete notification

## Environment Variables

See `.env.example` for all required environment variables.

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Deployment

This backend is designed to be deployed on Azure App Service.

See the main project README for deployment instructions.
