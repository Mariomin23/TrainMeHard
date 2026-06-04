import { Router } from 'express';
import { getStats, getProfessionals, approveProfessional, getAllSessions } from '../controllers/admin.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'super_admin'));

router.get('/stats', getStats);
router.get('/professionals', getProfessionals);
router.post('/professionals/:id/approve', approveProfessional);
router.get('/sessions', getAllSessions);

export default router;
