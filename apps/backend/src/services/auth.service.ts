import prisma from '../lib/db';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export class AuthService {
  /**
   * Quick login — find or create user by name.
   * For test/dev environment only. No password required.
   * Returns JWT token + user data.
   */
  async quickLogin(name: string) {
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length < 1) {
      throw new Error('Name is required');
    }

    // Derive a stable email-like identifier from name
    const slug = normalizedName.toLowerCase().replace(/\s+/g, '.');
    const email = `${slug}@systemize.local`;

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: normalizedName },
      create: {
        email,
        name: normalizedName,
        provider: 'local',
        providerId: `local-${slug}`,
      },
    });

    // Ensure user has a progress record
    await prisma.userProgress.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        totalXP: 0,
        currentLevel: 1,
        currentStreak: 0,
        longestStreak: 0,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, provider: user.provider },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Get current user profile
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: true,
        userBadges: { include: { badge: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      createdAt: user.createdAt,
      progress: user.progress,
      badgeCount: user.userBadges.length,
    };
  }
}

export const authService = new AuthService();
