import { Router } from 'express';
import { z } from 'zod';
import { createReview, getProfessionalReviews } from '../controllers/review.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { publicLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

const createReviewSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.post('/', requireAuth, validate(createReviewSchema), createReview);
router.get('/professional/:professionalId', publicLimiter, getProfessionalReviews);

export default router;
