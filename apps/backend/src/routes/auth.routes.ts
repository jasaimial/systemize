import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authService } from '../services/auth.service';

const router: Router = Router();

const quickLoginSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
});

// Quick login — name only, for test/dev environment
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = quickLoginSchema.parse(req.body);
    const result = await authService.quickLogin(name);

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({
      success: true,
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Logout — client just discards the token
router.post('/logout', authenticate, (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    meta: { timestamp: new Date().toISOString() },
  });
});

export default router;
