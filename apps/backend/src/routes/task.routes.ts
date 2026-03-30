import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { taskService } from '../services/task.service';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from '../validators/task.validator';

const router: Router = Router();

// All task routes require authentication
router.use(authenticate);

// List tasks with filtering, pagination, sorting
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = listTasksQuerySchema.parse(req.query);
    const result = await taskService.list(req.user!.id, query);

    res.json({
      success: true,
      data: result.tasks,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create a new task
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = createTaskSchema.parse(req.body);
    const task = await taskService.create(req.user!.id, input);

    res.status(201).json({
      success: true,
      data: task,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Get upcoming tasks (due in next 7 days)
router.get('/upcoming', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.getUpcoming(req.user!.id);

    res.json({
      success: true,
      data: tasks,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Get overdue tasks
router.get('/overdue', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await taskService.getOverdue(req.user!.id);

    res.json({
      success: true,
      data: tasks,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Get a single task
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.getById(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: task,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Update a task
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateTaskSchema.parse(req.body);
    const task = await taskService.update(req.user!.id, req.params.id, input);

    res.json({
      success: true,
      data: task,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Delete a task
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await taskService.delete(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Mark task as complete (awards XP)
router.post('/:id/complete', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await taskService.complete(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: result.task,
      meta: {
        timestamp: new Date().toISOString(),
        xpAwarded: result.xpAwarded,
        progress: result.progress,
        newBadges: result.newBadges,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Undo task completion (deducts XP)
router.post('/:id/uncomplete', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await taskService.uncomplete(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: result.task,
      meta: {
        timestamp: new Date().toISOString(),
        xpDeducted: result.xpDeducted,
        progress: result.progress,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
