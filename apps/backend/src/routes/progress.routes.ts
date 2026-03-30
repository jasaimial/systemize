import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { progressService } from '../services/progress.service';

const router: Router = Router();

// All progress routes require authentication
router.use(authenticate);

// Get user progress (XP, level, streak)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const progress = await progressService.getProgress(req.user!.id);
    res.json({
      success: true,
      data: progress,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Get badges (earned + locked)
router.get('/badges', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const badges = await progressService.getBadges(req.user!.id);
    res.json({
      success: true,
      data: badges,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Get completion stats
router.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await progressService.getStats(req.user!.id);
    res.json({
      success: true,
      data: stats,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
