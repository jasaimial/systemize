import prisma from '../lib/db';

export class ProgressService {
  /**
   * Get user progress (XP, level, streak)
   */
  async getProgress(userId: string) {
    const progress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      return {
        totalXP: 0,
        currentLevel: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityAt: null,
        xpToNextLevel: 500,
        levelProgress: 0,
      };
    }

    const xpThresholds = [0, 500, 1500, 3000, 5000, Infinity];
    const currentThreshold = xpThresholds[progress.currentLevel - 1] || 0;
    const nextThreshold = xpThresholds[progress.currentLevel] || Infinity;
    const xpInLevel = progress.totalXP - currentThreshold;
    const xpNeeded = nextThreshold - currentThreshold;

    return {
      ...progress,
      xpToNextLevel: nextThreshold === Infinity ? 0 : nextThreshold - progress.totalXP,
      levelProgress: nextThreshold === Infinity ? 100 : Math.round((xpInLevel / xpNeeded) * 100),
    };
  }

  /**
   * Get user's earned badges with badge details
   */
  async getBadges(userId: string) {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    // Also get all badges to show locked ones
    const allBadges = await prisma.badge.findMany({
      orderBy: { name: 'asc' },
    });

    return allBadges.map((badge) => {
      const earned = userBadges.find((ub) => ub.badgeId === badge.id);
      return {
        ...badge,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
      };
    });
  }

  /**
   * Get completion stats
   */
  async getStats(userId: string) {
    const [totalTasks, completedTasks, totalXPResult] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.task.aggregate({ where: { userId }, _sum: { xpAwarded: true } }),
    ]);

    const completionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Tasks completed by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCompleted = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: sevenDaysAgo },
      },
      select: { completedAt: true },
      orderBy: { completedAt: 'asc' },
    });

    return {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      completionRate,
      totalXPEarned: totalXPResult._sum.xpAwarded || 0,
      recentCompletions: recentCompleted.length,
    };
  }
}

export const progressService = new ProgressService();
