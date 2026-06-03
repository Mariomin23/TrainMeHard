import { Router } from 'express';
import { z } from 'zod';
import { search, getById, getMyProfile, updateProfile, approveProfile } from '../controllers/professional.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { publicLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  specialties: z.array(z.string()).optional(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  sessionPrice: z.number().min(0).optional(),
  professionalType: z.enum(['trainer', 'nutritionist', 'physiotherapist']).optional(),
});

router.get('/', publicLimiter, search);
router.get('/me', requireAuth, requireRole('professional'), getMyProfile);
router.get('/:id', publicLimiter, getById);
router.patch('/me', requireAuth, requireRole('professional'), validate(updateProfileSchema), updateProfile);
router.post('/:id/approve', requireAuth, requireRole('admin', 'super_admin'), approveProfile);

export default router;
