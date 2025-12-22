import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data
  await prisma.notification.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.task.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test Student',
      provider: 'google',
      providerId: 'test-google-id-123',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestStudent',
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create user progress
  const progress = await prisma.userProgress.create({
    data: {
      userId: testUser.id,
      totalXP: 850,
      currentLevel: 2,
      currentStreak: 5,
      longestStreak: 7,
    },
  });

  console.log('✅ Created user progress:', progress);

  // Create badges
  const badges = await prisma.badge.createMany({
    data: [
      {
        name: 'First Steps',
        description: 'Complete your first task',
        icon: '🎯',
        category: 'milestone',
        xpRequired: null,
        criteria: JSON.stringify({ tasksCompleted: 1 }),
      },
      {
        name: 'On Fire',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: 'streak',
        xpRequired: null,
        criteria: JSON.stringify({ streakDays: 7 }),
      },
      {
        name: 'Knowledge Seeker',
        description: 'Complete 50 assignments',
        icon: '📚',
        category: 'completion',
        xpRequired: null,
        criteria: JSON.stringify({ tasksCompleted: 50 }),
      },
      {
        name: 'Time Master',
        description: '10 early submissions in a row',
        icon: '⏰',
        category: 'completion',
        xpRequired: null,
        criteria: JSON.stringify({ earlySubmissions: 10 }),
      },
      {
        name: 'Item Detective',
        description: 'Track and find 5 lost items',
        icon: '🔍',
        category: 'special',
        xpRequired: null,
        criteria: JSON.stringify({ lostItemsFound: 5 }),
      },
      {
        name: 'Perfect Week',
        description: 'Complete all tasks for a week',
        icon: '🏆',
        category: 'streak',
        xpRequired: null,
        criteria: JSON.stringify({ perfectDays: 7 }),
      },
      {
        name: 'Rising Star',
        description: 'Reach Level 5',
        icon: '⭐',
        category: 'milestone',
        xpRequired: 5000,
      },
    ],
  });

  console.log('✅ Created', badges.count, 'badges');

  // Award first badge to test user
  const firstStepsBadge = await prisma.badge.findFirst({
    where: { name: 'First Steps' },
  });

  if (firstStepsBadge) {
    await prisma.userBadge.create({
      data: {
        userId: testUser.id,
        badgeId: firstStepsBadge.id,
      },
    });
    console.log('✅ Awarded "First Steps" badge to test user');
  }

  // Create sample tasks
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const tasks = await prisma.task.createMany({
    data: [
      {
        userId: testUser.id,
        title: 'Math Homework - Chapter 5',
        description: 'Complete problems 1-20 on page 87',
        dueDate: tomorrow,
        category: 'HOMEWORK',
        priority: 'HIGH',
        status: 'PENDING',
        subject: 'Mathematics',
      },
      {
        userId: testUser.id,
        title: 'Science Project - Volcano Model',
        description: 'Build and present volcano model for science fair',
        dueDate: nextWeek,
        category: 'PROJECT',
        priority: 'HIGH',
        status: 'PENDING',
        subject: 'Science',
      },
      {
        userId: testUser.id,
        title: 'English Essay - Book Report',
        description: 'Write 500-word essay on "The Giver"',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        category: 'HOMEWORK',
        priority: 'MEDIUM',
        status: 'PENDING',
        subject: 'English',
      },
      {
        userId: testUser.id,
        title: 'History Quiz Prep',
        description: 'Study chapters 8-10 for Friday quiz',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        category: 'QUIZ',
        priority: 'MEDIUM',
        status: 'PENDING',
        subject: 'History',
      },
      {
        userId: testUser.id,
        title: 'Find Lost Hoodie',
        description: 'Black hoodie with school logo, last seen in gym',
        category: 'LOST_ITEM',
        priority: 'LOW',
        status: 'PENDING',
      },
      {
        userId: testUser.id,
        title: 'Completed Math Worksheet',
        description: 'Finished early!',
        dueDate: yesterday,
        category: 'HOMEWORK',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        subject: 'Mathematics',
        xpAwarded: 150,
        completedAt: yesterday,
      },
    ],
  });

  console.log('✅ Created', tasks.count, 'sample tasks');

  // Create sample notifications
  const morningDigest = await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'morning_digest',
      title: '☀️ Good Morning!',
      message: 'You have 4 tasks due today. Let\'s make it a great day!',
      scheduledAt: new Date(),
      sentAt: new Date(),
      isRead: false,
    },
  });

  console.log('✅ Created sample notification');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Test User Credentials:');
  console.log('  Email:', testUser.email);
  console.log('  Provider: Google (mock OAuth)');
  console.log('  Current Level:', progress.currentLevel);
  console.log('  Total XP:', progress.totalXP);
  console.log('  Current Streak:', progress.currentStreak, 'days');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
