import Review from '../models/Review.model.js';
import Session from '../models/Session.model.js';
import Professional from '../models/Professional.model.js';
import { makeError } from '../utils/errors.util.js';

export const createReview = async (userId, { sessionId, rating, comment }) => {
  const session = await Session.findById(sessionId);
  if (!session || String(session.userId) !== userId) {
    throw makeError('Session not found', 'SESSION_NOT_FOUND', 404);
  }
  if (session.status !== 'completed') {
    throw makeError('Session not completed yet', 'SESSION_NOT_COMPLETED', 409);
  }

  const review = await Review.create({
    userId,
    professionalId: session.professionalId,
    sessionId,
    rating,
    comment,
  });

  const allReviews = await Review.find({ professionalId: session.professionalId });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await Professional.findByIdAndUpdate(session.professionalId, {
    rating: +avgRating.toFixed(2),
    reviewCount: allReviews.length,
  });

  return review;
};

export const getReviewsByProfessional = async (professionalId) => {
  return Review.find({ professionalId })
    .populate('userId', 'firstName lastName avatar')
    .sort({ createdAt: -1 });
};
