import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import progressRoutes from './progress.routes';
import notificationRoutes from './notification.routes';

const router: Router = Router();

// API route documentation
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Systemize API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      tasks: '/tasks',
      progress: '/progress',
      notifications: '/notifications',
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/progress', progressRoutes);
router.use('/notifications', notificationRoutes);

export default router;
