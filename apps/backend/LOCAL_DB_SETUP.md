# Week 1: Local Database Setup - Execution Guide

## ✅ What I've Generated

1. **`prisma/schema.prisma`** - Complete database schema with:
   - User model (auth, profile)
   - Task model (homework, projects, lost items)
   - UserProgress model (XP, levels, streaks)
   - Badge & UserBadge models (achievements)
   - Notification model (reminders, digests)
   - All relationships and indexes

2. **`src/lib/db.ts`** - Prisma client singleton with:
   - Connection pooling
   - Development query logging
   - Graceful shutdown handling

3. **`src/lib/redis.ts`** - Redis client with:
   - Connection management
   - Helper functions (set, get, del, incr, expire)
   - Error handling and reconnection

4. **`prisma/seed.ts`** - Test data seeding script with:
   - Sample user with progress
   - 7 badges (First Steps, On Fire, Knowledge Seeker, etc.)
   - 6 tasks (various categories and statuses)
   - Sample notifications

5. **Updated `package.json`** - Added scripts:
   - `prisma:seed` - Seed database with test data
   - `db:reset` - Reset database (useful for development)

6. **Updated `.env.example`** - Database URL matches Docker Compose

---

## 🚀 Manual Execution Steps

### Step 1: Start Docker Containers (2 min)

```bash
cd /home/allen/projects/systemize
docker compose up -d
```

**Expected Output:**
```
✔ Container systemize-postgres  Started
✔ Container systemize-redis     Started
```

**Verify containers are running:**
```bash
docker compose ps
```

You should see both containers with status "Up".

---

### Step 2: Install New Dependencies (1-2 min)

```bash
cd apps/backend
pnpm install
```

This installs `@prisma/client`, `redis`, and the `prisma` CLI.

---

### Step 3: Generate Prisma Client (30 sec)

```bash
pnpm prisma:generate
```

**Expected Output:**
```
✔ Generated Prisma Client (5.7.1) to ./node_modules/@prisma/client
```

This creates TypeScript types from your schema.

---

### Step 4: Create Database Tables (1 min)

```bash
pnpm prisma:migrate
```

**When prompted for migration name, enter:** `init`

**Expected Output:**
```
✔ Enter a name for the new migration: init
✔ Created migration
✔ Applied migration
Your database is now in sync with your schema.
```

This creates:
- `prisma/migrations/` folder with SQL files
- All tables in your PostgreSQL database

---

### Step 5: Seed Test Data (30 sec)

```bash
pnpm prisma:seed
```

**Expected Output:**
```
🌱 Starting database seed...
✅ Created test user: test@example.com
✅ Created user progress
✅ Created 7 badges
✅ Awarded "First Steps" badge to test user
✅ Created 6 sample tasks
✅ Created sample notification
🎉 Database seeded successfully!

Test User Credentials:
  Email: test@example.com
  Provider: Google (mock OAuth)
  Current Level: 2
  Total XP: 850
  Current Streak: 5 days
```

---

### Step 6: Explore Data with Prisma Studio (optional, 5-10 min)

```bash
pnpm prisma:studio
```

Opens a web UI at `http://localhost:5555` where you can:
- Browse all tables
- View relationships
- Edit data visually
- Test queries

**Press Ctrl+C to exit when done.**

---

### Step 7: Test Database Connection in Backend (1 min)

Create a simple test file:

```bash
# Create test script
cat > test-db.ts << 'EOF'
import { prisma } from './src/lib/db';

async function test() {
  const users = await prisma.user.findMany({
    include: {
      progress: true,
      userBadges: {
        include: { badge: true }
      }
    }
  });

  console.log('Users:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

test();
EOF

# Run test
npx tsx test-db.ts

# Clean up
rm test-db.ts
```

**Expected Output:** JSON with test user data including progress and badge.

---

### Step 8: Test Redis Connection (1 min)

```bash
# Test Redis CLI
docker exec -it systemize-redis redis-cli ping
```

**Expected Output:** `PONG`

**Test from Node.js:**

```bash
cat > test-redis.ts << 'EOF'
import { getRedisClient, cacheHelpers } from './src/lib/redis';

async function test() {
  await cacheHelpers.set('test-key', 'Hello Redis!', 60);
  const value = await cacheHelpers.get('test-key');
  console.log('Redis test:', value);

  const client = await getRedisClient();
  await client.quit();
}

test();
EOF

npx tsx test-redis.ts
rm test-redis.ts
```

**Expected Output:** `Redis test: Hello Redis!`

---

## 🎯 Verification Checklist

- [ ] Docker containers running (`docker compose ps`)
- [ ] Prisma Client generated (check `node_modules/@prisma/client`)
- [ ] Migrations applied (`prisma/migrations/` folder exists)
- [ ] Database seeded (can view in Prisma Studio)
- [ ] PostgreSQL connection works (test script runs)
- [ ] Redis connection works (PING returns PONG)

---

## 🔧 Common Issues & Solutions

### Issue: "Port 5432 already in use"
**Solution:**
```bash
# Check what's using the port
sudo lsof -i :5432
# Kill existing PostgreSQL instance or change port in docker-compose.yml
```

### Issue: "Connection refused to localhost:5432"
**Solution:**
```bash
# Check container logs
docker compose logs postgres
# Wait for healthcheck to pass (may take 10-30 seconds)
docker compose ps  # Status should be "healthy"
```

### Issue: "Module '@prisma/client' not found"
**Solution:**
```bash
pnpm install
pnpm prisma:generate
```

### Issue: "Environment variable not found: DATABASE_URL"
**Solution:**
```bash
# Copy .env.example to .env if you haven't
cp .env.example .env
```

### Issue: Migration fails with "database doesn't exist"
**Solution:**
```bash
# Recreate database
docker compose down -v
docker compose up -d
# Wait 30 seconds for PostgreSQL to initialize
sleep 30
pnpm prisma:migrate
```

---

## 📊 What's Now Working

After completing these steps, you have:

✅ **Local PostgreSQL database** with complete schema
✅ **Local Redis cache** ready for sessions/rate limiting
✅ **Test data** to develop against
✅ **Prisma Client** with full TypeScript types
✅ **Database utilities** ready to use in your code
✅ **Visual database browser** (Prisma Studio)

---

## 🔜 Next Steps (After This Week)

Once you verify everything works:

1. Update backend routes to use real database queries
2. Implement authentication with real OAuth
3. Add business logic (XP calculation, badge unlocking)
4. Write integration tests with test database

---

## 🧹 Cleanup Commands

**Reset database (start fresh):**
```bash
pnpm db:reset
```

**Stop containers (keep data):**
```bash
docker compose stop
```

**Stop and remove containers + data:**
```bash
docker compose down -v
```

---

## ⏱️ Estimated Time

- **Total**: 30-45 minutes (including exploration)
- **Core setup**: 10-15 minutes
- **Learning/exploration**: 15-30 minutes

---

**Ready? Start with Step 1! 🚀**
