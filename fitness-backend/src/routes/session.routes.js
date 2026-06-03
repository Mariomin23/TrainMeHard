import { Router } from 'express';
import { z } from 'zod';
import { createSession, checkout, getMySessions } from '../controllers/session.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

const createSessionSchema = z.object({
  professionalId: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
});

router.post('/', requireAuth, validate(createSessionSchema), createSession);
router.post('/:id/checkout', requireAuth, checkout);
router.get('/', requireAuth, getMySessions);

export default router;
