import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth-middleware';
import { validateBody } from '../middleware/validate';
import { AdminController } from '../controllers/admin-controller';
import { roleChangeSchema } from '../validation/admin-validation';

export const adminRouter = Router();

adminRouter.get('/home', requireAuth, requireRole('admin'), AdminController.home);

adminRouter.post(
    '/promote',
    requireAuth,
    requireRole('admin'),
    validateBody(roleChangeSchema),
    AdminController.promote,
);

adminRouter.post(
    '/demote',
    requireAuth,
    requireRole('admin'),
    validateBody(roleChangeSchema),
    AdminController.demote,
);

adminRouter.delete(
    '/users/:username',
    requireAuth,
    requireRole('admin'),
    AdminController.deleteUser,
);
