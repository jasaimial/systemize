import prisma from '../lib/db';

// Badge unlock criteria definitions
const BADGE_CRITERIA: Record<string, (ctx: BadgeContext) => boolean> = {
  'First Steps': (ctx) => ctx.totalCompleted >= 1,
  'On Fire': (ctx) => ctx.currentStreak >= 7,
  'Knowledge Seeker': (ctx) => ctx.totalCompleted >= 50,
  'Time Master': (ctx) => ctx.earlyCompletions >= 10,
  'Item Detective': (ctx) => ctx.lostItemsFound >= 5,
  'Perfect Week': (ctx) => ctx.currentStreak >= 7 && ctx.perfectDays >= 7,
  'Rising Star': (ctx) => ctx.totalXP >= 5000,
};

interface BadgeContext {
  totalCompleted: number;
  currentStreak: number;
  totalXP: number;
  earlyCompletions: number;
  lostItemsFound: number;
  perfectDays: number;
}

export class BadgeService {
  /**
   * Check and award any newly earned badges after a task completion.
   * Returns list of newly awarded badges.
   */
  async checkAndAwardBadges(userId: string) {
    // Build context for badge evaluation
    const [progress, taskStats, earlyCount, lostItemCount, existingBadges] = await Promise.all([
      prisma.userProgress.findUnique({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.task.count({
        where: { userId, status: 'COMPLETED', xpAwarded: 150 },
      }),
      prisma.task.count({
        where: { userId, status: 'COMPLETED', category: 'LOST_ITEM' },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        select: { badge: { select: { name: true } } },
      }),
    ]);

    const earnedNames = new Set(existingBadges.map((ub) => ub.badge.name));

    const ctx: BadgeContext = {
      totalCompleted: taskStats,
      currentStreak: progress?.currentStreak || 0,
      totalXP: progress?.totalXP || 0,
      earlyCompletions: earlyCount,
      lostItemsFound: lostItemCount,
      perfectDays: progress?.currentStreak || 0, // simplified: streak = perfect days
    };

    // Check each badge
    const allBadges = await prisma.badge.findMany();
    const newlyEarned: typeof allBadges = [];

    for (const badge of allBadges) {
      if (earnedNames.has(badge.name)) continue; // already earned

      const checkFn = BADGE_CRITERIA[badge.name];
      if (checkFn && checkFn(ctx)) {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
        newlyEarned.push(badge);
      }
    }

    return newlyEarned;
  }
}

export const badgeService = new BadgeService();
