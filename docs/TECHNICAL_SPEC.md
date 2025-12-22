# Systemize - Technical Architecture & Implementation Guide

## 1. Technology Stack Recommendations

### 1.1 Recommended Stack (MVP)

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│  Next.js 14 + TypeScript + Tailwind CSS + PWA  │
│              React Query + Zustand              │
└────────────────┬────────────────────────────────┘
                 │
                 │ REST API (HTTPS)
                 │
┌────────────────▼────────────────────────────────┐
│                   BACKEND                       │
│      Node.js 20 + TypeScript + Express         │
│           Prisma ORM + Zod Validation           │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼────────┐ ┌─────▼──────────────────┐
│   Auth Layer   │ │   Data Layer            │
│                │ │                         │
│  Azure AD B2C  │ │  Azure Database for     │
│  (Microsoft/   │ │  PostgreSQL Flexible    │
│   Google OAuth)│ │  + Azure Cache for Redis│
└────────────────┘ └─────────────────────────┘
        │                 │
        │                 │
┌───────▼─────────────────▼──────────────────────┐
│         Azure Infrastructure                    │
│                                                 │
│  Hosting: Azure Static Web Apps (FE)           │
│           Azure App Service (BE)               │
│  CDN: Azure CDN / Front Door                   │
│  Storage: Azure Blob Storage                   │
│  Notifications: Azure Communication Services   │
│                 + Azure Notification Hubs      │
│  Monitoring: Azure Application Insights        │
│  Analytics: Application Insights / PostHog     │
└─────────────────────────────────────────────────┘
```

---

## 2. Detailed Technology Choices

### 2.1 Frontend Technology

#### **Framework: Next.js 14 (App Router)**

**Why Next.js?**
- ✅ Server-side rendering for fast initial load
- ✅ Built-in routing and API routes
- ✅ Excellent developer experience
- ✅ Easy deployment on Vercel
- ✅ Great SEO if you expand to public launch
- ✅ Supports PWA for mobile-like experience
- ✅ Code splitting and optimization out of the box

**Alternative Considered:**
- *Vite + React*: Faster dev server but requires more setup
- *Remix*: Great but smaller ecosystem

**Key Libraries:**
```json
{
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "date-fns": "^3.0.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.300.0",
    "sonner": "^1.2.0",
    "vaul": "^0.9.0"
  }
}
```

**UI Component Strategy:**
- **shadcn/ui**: Copy-paste components (customizable, no bloat)
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Headless components for accessibility
- **Framer Motion**: Smooth animations

---

### 2.2 Backend Technology

#### **Framework: Node.js + Express + TypeScript**

**Why Node.js?**
- ✅ Same language as frontend (TypeScript everywhere)
- ✅ Excellent for real-time features (WebSockets if needed)
- ✅ Massive ecosystem (npm)
- ✅ Great async performance for I/O operations
- ✅ You can share types between FE and BE
- ✅ Fast development cycle

**Alternative Considered:**
- *Python + FastAPI*: Great but different language
- *Go*: Fast but steeper learning curve for rapid prototyping
- *Serverless (AWS Lambda)*: Good but cold starts and complexity

**Key Libraries:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.3.3",
    "@prisma/client": "^5.7.1",
    "prisma": "^5.7.1",
    "zod": "^3.22.4",
    "jsonwebtoken": "^9.0.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "redis": "^4.6.12",
    "node-cron": "^3.0.3",
    "@azure/identity": "^4.0.0",
    "@azure/notification-hubs": "^1.2.0",
    "@azure/communication-email": "^1.0.0",
    "@azure/storage-blob": "^12.17.0",
    "applicationinsights": "^2.9.1",
    "@azure/keyvault-secrets": "^4.7.0",
    "passport": "^0.7.0",
    "passport-azure-ad": "^4.3.5"
  }
}
```

**Architecture Pattern: Layered Architecture**
```
src/
├── routes/          # Express route handlers
├── controllers/     # Business logic
├── services/        # Reusable business logic
├── repositories/    # Data access layer
├── models/          # Prisma schemas
├── middleware/      # Auth, validation, error handling
├── utils/           # Helpers
├── types/           # TypeScript types
└── config/          # Configuration
```

---

### 2.3 Database

#### **Primary Database: Azure Database for PostgreSQL - Flexible Server**

**Why Azure PostgreSQL?**
- ✅ Fully managed PostgreSQL service
- ✅ ACID compliance (data integrity)
- ✅ JSON support for flexible fields
- ✅ Excellent with Prisma ORM
- ✅ Built-in high availability and backups
- ✅ Integrated with Azure AD for secure authentication
- ✅ Seamless scaling and performance tuning
- ✅ Free tier available (Burstable B1ms with 12 months free)

**Schema Design (High-level):**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  provider      String    // 'google' | 'microsoft'
  providerId    String
  createdAt     DateTime  @default(now())
  lastLoginAt   DateTime?
  
  tasks         Task[]
  progress      UserProgress?
  notifications Notification[]
  badges        UserBadge[]
}

model Task {
  id            String    @id @default(cuid())
  userId        String
  title         String
  description   String?
  dueDate       DateTime?
  category      TaskCategory
  priority      Priority
  status        TaskStatus  @default(PENDING)
  subject       String?
  xpAwarded     Int         @default(0)
  completedAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  user          User        @relation(fields: [userId], references: [id])
  notifications Notification[]
  
  @@index([userId, status])
  @@index([dueDate])
}

model UserProgress {
  id              String   @id @default(cuid())
  userId          String   @unique
  totalXP         Int      @default(0)
  currentLevel    Int      @default(1)
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  lastActivityAt  DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
}

model Badge {
  id          String      @id @default(cuid())
  name        String      @unique
  description String
  icon        String
  xpRequired  Int?
  
  userBadges  UserBadge[]
}

model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String
  earnedAt  DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  badge     Badge    @relation(fields: [badgeId], references: [id])
  
  @@unique([userId, badgeId])
}

enum TaskCategory {
  HOMEWORK
  PROJECT
  TEST
  QUIZ
  LOST_ITEM
  PERSONAL
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum TaskStatus {
  PENDING
  COMPLETED
  OVERDUE
}
```

#### **Cache: Azure Cache for Redis**

**Why Azure Cache for Redis?**
- ✅ Fully managed Redis service
- ✅ Session storage
- ✅ Rate limiting
- ✅ Caching API responses
- ✅ Real-time leaderboards (sorted sets)
- ✅ Background job queues
- ✅ Built-in high availability (Premium tier)
- ✅ Azure Private Link support for security
- ✅ Redis 6.x with Redis modules support

**Use Cases:**
- Session tokens
- Cached user progress
- Rate limit counters
- Task completion statistics

---

### 2.4 Authentication

#### **Recommended: Azure AD B2C (Azure Active Directory B2C)**

**Why Azure AD B2C?**
- ✅ Built-in OAuth providers (Google, Microsoft, Facebook, etc.)
- ✅ Microsoft ecosystem integration (perfect for school accounts)
- ✅ 50,000 free monthly active users
- ✅ Customizable user flows and branding
- ✅ MFA support out of the box
- ✅ GDPR compliant
- ✅ Industry-grade security
- ✅ Seamless integration with Azure services

**Perfect for Your Use Case:**
- If your son's school uses Microsoft 365, instant authentication
- Parents likely have Microsoft accounts
- Easy to add Google as identity provider too

**Authentication Flow:**
```
1. User clicks "Sign in with Microsoft" or "Sign in with Google"
2. Redirected to Azure AD B2C hosted login page
3. OAuth provider authenticates user
4. Azure AD B2C returns to callback URL with code
5. Backend exchanges code for JWT access token
6. Frontend stores token (httpOnly cookie)
7. All API requests include token in Authorization header
8. Backend validates token via Azure AD B2C JWKS endpoint
```

---

### 2.5 Hosting & Deployment

#### **Frontend: Azure Static Web Apps**

**Why Azure Static Web Apps?**
- ✅ Perfect for Next.js (full support with SSR)
- ✅ Automatic deployments from GitHub/Azure DevOps
- ✅ Global CDN via Azure Front Door
- ✅ Custom domains with free SSL
- ✅ Generous free tier (100 GB bandwidth/month)
- ✅ Integrated with Azure AD B2C
- ✅ Built-in staging environments
- ✅ API routes can call Azure Functions
- ✅ Native Azure ecosystem integration

**Deployment:**
```bash
# Connect GitHub repo to Azure Static Web Apps
# Auto-deploy on push to main
# Preview deployments for PRs
# Azure CLI: az staticwebapp create
```

#### **Backend: Azure App Service (Linux + Node.js)**

**Why Azure App Service?**
- ✅ Fully managed PaaS for Node.js
- ✅ Auto-deploy from GitHub with GitHub Actions
- ✅ Built-in environment variables and secrets (Key Vault integration)
- ✅ Auto-scaling capabilities
- ✅ Free tier (F1) available for development
- ✅ Integrated logging to Application Insights
- ✅ Virtual Network integration for secure database access
- ✅ Easy CI/CD with Azure DevOps or GitHub Actions
- ✅ Deployment slots for zero-downtime deployments

**Alternative Options:**
- **Azure Container Apps**: More modern, serverless container platform (recommended for future)
- **Azure Functions**: For serverless approach (good for notification cron jobs)

**Deployment:**
```bash
# Azure CLI deployment
az webapp up --runtime "NODE:20-lts" --name systemize-api
# Or use GitHub Actions for CI/CD
```

---

### 2.6 Push Notifications

#### **Push Notifications: Azure Notification Hubs + Azure Communication Services**

**Why Azure Notification Hubs?**
- ✅ Enterprise-grade push notification platform
- ✅ Works on web, iOS, Android (multi-platform)
- ✅ Free tier: 1 million pushes/month
- ✅ Tag-based targeting for user segmentation
- ✅ Scheduled notifications support
- ✅ Native integration with Azure ecosystem
- ✅ Rich telemetry and analytics

**Implementation:**
1. User grants notification permission in browser/app
2. Register device with Azure Notification Hub (stores device handle)
3. Backend tags devices by userId
4. Azure Function (cron) checks for due tasks
5. Backend sends notification via Notification Hub API
6. User receives on all registered devices

**For Web Push (PWA):**
- Use Web Push Protocol with service workers
- Azure Notification Hubs supports web push notifications
- VAPID keys for authentication

**Azure Communication Services for Fallback:**
- ✅ Email notifications (native Azure email service)
- ✅ SMS notifications (Phase 2)
- ✅ 1,000 free emails/month
- ✅ Unified communication platform

---

### 2.7 Monitoring & Analytics

#### **Monitoring & Analytics: Azure Application Insights**

**Why Application Insights?**
- ✅ Full-stack monitoring (frontend + backend + database)
- ✅ Automatic error tracking and exception logging
- ✅ Performance monitoring (API response times, page load)
- ✅ Custom event tracking (task created, completed, etc.)
- ✅ User flow analytics and session tracking
- ✅ Live metrics stream for real-time debugging
- ✅ Powerful KQL query language for custom dashboards
- ✅ Integrated with all Azure services
- ✅ 5 GB free data ingestion per month
- ✅ Proactive failure detection and smart alerts

**SDK Integration:**
```typescript
// Frontend: Next.js + App Insights
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Backend: Node.js + App Insights
import * as appInsights from 'applicationinsights';
```

**Alternative for Privacy-First Analytics:**
- **PostHog**: Can still use for product analytics (complementary)
- Self-hosted option available if privacy is critical

---

## 3. Cloud Platform Comparison

### 3.1 Option A: Supabase-Centric (RECOMMENDED FOR MVP)

```
┌─────────────────────────────────────┐
│  Frontend: Vercel (Next.js)         │
└────────────┬────────────────────────┘
             │
             │
┌────────────▼────────────────────────┐
│  Supabase (All-in-One)              │
│  - PostgreSQL Database              │
│  - Authentication (OAuth)           │
│  - Storage (Avatars)                │
│  - Real-time Subscriptions          │
│  - Edge Functions (Serverless)      │
└─────────────────────────────────────┘
```

**Pros:**
- ✅ Simplest setup
- ✅ All-in-one solution
- ✅ Generous free tier (50,000 MAU)
- ✅ Automatic backups
- ✅ Great DX

**Cons:**
- ⚠️ Vendor lock-in (but open-source)
- ⚠️ Less control over backend logic

**Cost:**
- Free: Up to 500MB database, 1GB file storage
- Pro: $25/month (if you expand)

---

### 3.2 Option B: AWS-Based

```
Frontend: Vercel
Backend: AWS ECS Fargate (Dockerized)
Database: AWS RDS PostgreSQL
Cache: AWS ElastiCache Redis
Auth: AWS Cognito
Storage: S3
Notifications: AWS SNS + FCM
```

**Pros:**
- ✅ Most scalable
- ✅ Enterprise-grade
- ✅ Full control

**Cons:**
- ❌ Complex setup
- ❌ Expensive learning curve
- ❌ Overkill for MVP
- ❌ Higher costs

**Cost:**
- ~$30-50/month minimum

---

### 3.3 Option C: Azure-Based (RECOMMENDED)

```
Frontend: Azure Static Web Apps (Next.js)
Backend: Azure App Service (Node.js)
Database: Azure Database for PostgreSQL Flexible Server
Auth: Azure AD B2C
Cache: Azure Cache for Redis (Basic tier)
Notifications: Azure Notification Hubs + Communication Services
Storage: Azure Blob Storage
Monitoring: Azure Application Insights
```

**Pros:**
- ✅ Perfect if school uses Microsoft 365 (instant auth)
- ✅ Seamless integration with Microsoft accounts
- ✅ Azure for Students: $100 free credit
- ✅ All services in one ecosystem (easy networking/security)
- ✅ Enterprise-grade reliability and security
- ✅ Excellent for learning Azure (career valuable)
- ✅ Unified monitoring and logging
- ✅ Can use Azure DevOps for project management
- ✅ Built-in CI/CD with GitHub Actions integration

**Cons:**
- ⚠️ Initial setup requires learning Azure concepts
- ⚠️ Portal UI can be overwhelming at first
- ⚠️ More configuration options = more decisions

**Cost (with Free Tiers):**
- Static Web Apps: Free (100 GB bandwidth)
- App Service: Free F1 tier (dev), ~$13/month B1 (prod)
- PostgreSQL: Free 12 months B1ms, then ~$12/month
- Redis: ~$16/month Basic C0
- AD B2C: Free (up to 50K MAU)
- Notification Hubs: Free (1M pushes/month)
- Application Insights: Free (5 GB/month)
- **Total: $0 for 12 months, then ~$30-45/month**

---

### 3.4 Final Recommendation: **Azure-First Approach**

```
Frontend:      Azure Static Web Apps (Next.js 14)
Backend:       Azure App Service (Node.js 20 + Express)
Database:      Azure Database for PostgreSQL Flexible Server
Auth:          Azure AD B2C (Microsoft + Google OAuth)
Cache:         Azure Cache for Redis (Basic C0)
Notifications: Azure Notification Hubs + Communication Services
Storage:       Azure Blob Storage
Monitoring:    Azure Application Insights
CDN:           Azure Front Door (if needed)
CI/CD:         GitHub Actions → Azure
```

**Why This Azure Stack?**
- ✅ **Best for your scenario**: School likely uses Microsoft 365
- ✅ **Single ecosystem**: All services work seamlessly together
- ✅ **Free for 12 months**: Azure for Students credit
- ✅ **Enterprise-grade**: Production-ready from day one
- ✅ **Career valuable**: Azure skills are highly marketable
- ✅ **Great developer experience**: Modern tooling with Azure CLI
- ✅ **Easy to scale**: From 1 to 100,000 users
- ✅ **Total cost**: $0 for first year, then ~$30-45/month
- ✅ **Security built-in**: VNET, Private Link, managed identities
- ✅ **Unified monitoring**: Single dashboard for everything

---

## 4. Development Setup

### 4.1 Local Development Environment

```bash
# Prerequisites
- Node.js 20.x
- pnpm (faster than npm)
- PostgreSQL 15 (Docker)
- Redis 7 (Docker)
- VS Code + Extensions
```

### 4.2 Recommended VS Code Extensions
```
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- GitLens
- Thunder Client (API testing)
```

### 4.3 Project Structure

```
systemize/
├── frontend/                 # Next.js app
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   ├── styles/          # Global styles
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── types/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                   # Shared types
│   ├── types/
│   └── validators/
│
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── TECHNICAL_SPEC.md
│   └── API_DOCS.md
│
├── docker-compose.yml        # Local dev services
├── .github/
│   └── workflows/
│       ├── frontend-deploy.yml
│       └── backend-deploy.yml
│
└── README.md
```

---

## 5. API Design

### 5.1 RESTful Endpoints

#### **Authentication**
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
```

#### **Tasks**
```
GET    /api/tasks              # List all tasks
POST   /api/tasks              # Create task
GET    /api/tasks/:id          # Get single task
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
POST   /api/tasks/:id/complete # Mark complete
GET    /api/tasks/upcoming     # Due in next 7 days
GET    /api/tasks/overdue      # Past due date
```

#### **User Progress**
```
GET    /api/progress           # Get user's XP, level, streaks
GET    /api/progress/badges    # Get earned badges
GET    /api/progress/stats     # Completion stats
POST   /api/progress/award-xp  # Award XP (internal)
```

#### **Notifications**
```
GET    /api/notifications          # List notifications
POST   /api/notifications/register # Register device token
PUT    /api/notifications/:id/read # Mark as read
DELETE /api/notifications/:id      # Delete notification
```

#### **Calendar**
```
GET    /api/calendar?start=DATE&end=DATE  # Get tasks in range
```

### 5.2 API Response Format

**Success:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-12-18T10:30:00Z",
    "version": "1.0"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task with ID abc123 not found",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-12-18T10:30:00Z"
  }
}
```

---

## 6. Security Considerations

### 6.1 Security Checklist

- [ ] **Authentication**: OAuth 2.0 only (no password management)
- [ ] **Authorization**: JWT tokens with expiration (15 min access, 7 day refresh)
- [ ] **HTTPS**: Enforce SSL everywhere
- [ ] **CORS**: Whitelist frontend domain only
- [ ] **Rate Limiting**: 100 requests per 15 minutes per IP
- [ ] **Input Validation**: Zod schemas on all inputs
- [ ] **SQL Injection**: Use Prisma (parameterized queries)
- [ ] **XSS Prevention**: Sanitize user inputs, CSP headers
- [ ] **CSRF Protection**: SameSite cookies
- [ ] **Secrets Management**: Environment variables, never commit
- [ ] **Database Backups**: Daily automated backups
- [ ] **Logging**: Log security events (failed logins, etc.)

### 6.2 Environment Variables

```bash
# Backend .env (use Azure Key Vault for production)
DATABASE_URL="postgresql://username@servername.postgres.database.azure.com:5432/systemize?ssl=true"
AZURE_REDIS_URL="systemize-redis.redis.cache.windows.net:6380"
AZURE_REDIS_KEY="..."
JWT_SECRET="..."  # Or use managed identity

# Azure AD B2C
AZURE_AD_B2C_TENANT_NAME="systemize"
AZURE_AD_B2C_CLIENT_ID="..."
AZURE_AD_B2C_CLIENT_SECRET="..."  # Store in Key Vault
AZURE_AD_B2C_POLICY_NAME="B2C_1_signupsignin"

# Azure Notification Hubs
AZURE_NOTIFICATION_HUB_NAME="systemize-notifications"
AZURE_NOTIFICATION_HUB_CONNECTION_STRING="..."  # Store in Key Vault

# Azure Communication Services
AZURE_COMMUNICATION_CONNECTION_STRING="..."

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME="systemizestorage"
AZURE_STORAGE_ACCOUNT_KEY="..."  # Or use managed identity

# Azure Application Insights
APPINSIGHTS_INSTRUMENTATION_KEY="..."
APPLICATIONINSIGHTS_CONNECTION_STRING="..."

NODE_ENV="production"

# Frontend .env.local (Azure Static Web Apps)
NEXT_PUBLIC_API_URL="https://systemize-api.azurewebsites.net"
NEXT_PUBLIC_AZURE_AD_B2C_TENANT="systemize.b2clogin.com"
NEXT_PUBLIC_AZURE_AD_B2C_CLIENT_ID="..."
NEXT_PUBLIC_AZURE_AD_B2C_POLICY="B2C_1_signupsignin"
NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATION_KEY="..."
```

---

## 7. Testing Strategy

### 7.1 Testing Pyramid

```
           /\
          /  \
         /E2E \          ← Few (Playwright)
        /------\
       /  API   \        ← Some (Jest + Supertest)
      /----------\
     / Unit Tests \      ← Many (Jest + React Testing Library)
    /--------------\
```

### 7.2 Tools

- **Unit Tests**: Jest + React Testing Library
- **API Tests**: Jest + Supertest
- **E2E Tests**: Playwright
- **Type Safety**: TypeScript (compile-time testing)

### 7.3 Coverage Goals

- Critical paths: 80%+
- UI components: 60%+
- Utilities: 90%+

---

## 8. Performance Targets

### 8.1 Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Page Load (FCP) | <1.5s | <3s |
| Time to Interactive | <2s | <4s |
| API Response (p95) | <200ms | <500ms |
| Lighthouse Score | >90 | >70 |
| Bundle Size | <200KB | <500KB |

### 8.2 Optimization Strategies

- Code splitting (Next.js automatic)
- Image optimization (next/image)
- API response caching (Redis)
- Database query optimization (Prisma indexes)
- CDN for static assets (Vercel Edge)

---

## 9. Cost Estimation

### 9.1 MVP Costs (Monthly) - Azure Stack

| Service | Free Tier | Paid (After Free Period) |
|---------|-----------|---------------------------|
| Azure Static Web Apps | ✅ Free (100 GB bandwidth) | Free for most use |
| Azure App Service | ✅ F1 Free tier | $13/mo (B1 Basic) |
| Azure PostgreSQL | ✅ 12 months free (B1ms) | $12/mo (Burstable) |
| Azure Cache for Redis | No free tier | $16/mo (Basic C0) |
| Azure AD B2C | ✅ Free (50K MAU) | Free for MVP scale |
| Azure Notification Hubs | ✅ Free (1M pushes/mo) | Free for MVP scale |
| Azure Communication Services | ✅ Free (1K emails/mo) | Pay-as-you-go |
| Azure Blob Storage | ✅ Free (5 GB + 20K ops) | ~$1-2/mo |
| Application Insights | ✅ Free (5 GB/mo) | ~$2-5/mo |
| Domain (.com) | $12/year | - |

**Total MVP Cost:**
- **First 12 months**: $16-20/month (Redis + App Service F1/B1)
- **After 12 months**: $30-45/month
- **With Azure for Students credit**: $0 for first year!

### 9.2 Scale-Up Costs (1000 active users)

- Azure Static Web Apps: Free
- Azure App Service: $55/month (S1 Standard)
- Azure PostgreSQL: $50/month (General Purpose 2 vCore)
- Azure Cache for Redis: $55/month (Standard C1)
- Azure AD B2C: Free (under 50K MAU)
- Azure Notification Hubs: Free (under 1M pushes)
- Application Insights: $20/month (~10 GB)
- Azure Blob Storage: $5/month
- **Total: ~$185-240/month at scale**

---

## 10. Implementation Roadmap

### Week 1-2: Foundation
- [ ] Set up Azure subscription (Azure for Students if eligible)
- [ ] Set up repositories (monorepo with Turborepo or separate repos)
- [ ] Initialize Next.js frontend
- [ ] Initialize Express backend
- [ ] Create Azure resources:
  - [ ] Resource Group
  - [ ] Azure Database for PostgreSQL Flexible Server
  - [ ] Azure Cache for Redis
  - [ ] Azure AD B2C tenant and configure identity providers
  - [ ] Azure Static Web Apps
  - [ ] Azure App Service
- [ ] Configure Azure AD B2C authentication flows
- [ ] Design database schema with Prisma
- [ ] Set up GitHub Actions for CI/CD to Azure
- [ ] Configure Application Insights

### Week 3-4: Core Features
- [ ] Task CRUD API endpoints
- [ ] Task UI components
- [ ] Gamification logic (XP, levels)
- [ ] Dashboard with stats
- [ ] Calendar view

### Week 5: Notifications & Polish
- [ ] FCM integration
- [ ] Notification scheduling (cron jobs)
- [ ] UI polish and animations
- [ ] Mobile responsive testing

### Week 6-8: Beta & Iteration
- [ ] Deploy to production
- [ ] Real-world testing with your son
- [ ] Bug fixes
- [ ] UX improvements
- [ ] Performance optimization

---

## 11. Key Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | Next.js | Best DX, SEO, Azure SWA support |
| Backend Language | Node.js + TypeScript | Same language as FE, fast dev |
| Database | Azure PostgreSQL | Managed, integrated, 12mo free |
| Auth Provider | Azure AD B2C | Microsoft ecosystem, school integration |
| Hosting | Azure Static Web Apps + App Service | Unified ecosystem, free tier |
| Notifications | Azure Notification Hubs | Enterprise-grade, 1M free pushes |
| Cache | Azure Cache for Redis | Managed, secure, built-in HA |
| Monitoring | Application Insights | Full-stack visibility, unified |
| State Management | React Query + Zustand | Server state + client state |
| Styling | Tailwind + shadcn/ui | Fast, customizable |

---

## 12. Migration to Mobile (Phase 2)

### React Native Consideration

**Pros of React Native:**
- ✅ Share business logic with web
- ✅ One codebase for iOS and Android
- ✅ Large ecosystem

**Migration Path:**
1. Extract shared logic to packages
2. Use Expo for faster development
3. Reuse API layer
4. Rebuild UI with native components (React Native Paper)
5. Native notifications (easier than web)

**Alternative: PWA First**
- Your Next.js app can be a PWA
- Install on home screen
- Push notifications work
- Feels like native app
- Skip app store hassles
- **Recommend this for MVP Phase 2**

---

## 13. Next Steps

### Immediate Actions
1. ✅ Review this spec with your son (get his input!)
2. ⬜ Set up GitHub repository
3. ⬜ Create Azure subscription:
   - Apply for Azure for Students ($100 credit)
   - Or use regular subscription with free tiers
4. ⬜ Install Azure CLI and authenticate: `az login`
5. ⬜ Create Azure resource group: `az group create --name systemize-rg --location eastus`
6. ⬜ Set up Azure AD B2C tenant
7. ⬜ Initialize frontend boilerplate (Next.js)
8. ⬜ Initialize backend boilerplate (Express + TypeScript)
9. ⬜ Design high-fidelity mockups (Figma?)
10. ⬜ Set up Azure DevOps project (optional, for boards/pipelines)

---

## 14. Questions to Answer Before Starting

1. **Design**: Do you have design skills, or need a template?
   - Consider: [shadcn/ui templates](https://ui.shadcn.com)
   
2. **Domain Name**: What domain do you want?
   - Suggestions: `systemize.app`, `taskifylife.com`, `habitforge.io`

3. **Development Time**: How many hours per week?
   - Realistic MVP: 60-80 hours total

4. **Launch Date**: When do you want your son to start using it?
   - Recommend: 8-10 weeks from start

---

**Document Version**: 1.0  
**Last Updated**: December 18, 2025  
**Author**: GitHub Copilot  
**Next Review**: After repository setup
