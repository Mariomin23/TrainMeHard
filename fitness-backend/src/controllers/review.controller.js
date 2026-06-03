import Review from '../models/Review.model.js';
import Session from '../models/Session.model.js';
import Professional from '../models/Professional.model.js';
import { success } from '../utils/apiResponse.util.js';

const makeError = (msg, code, statusCode) =>
  Object.assign(new Error(msg), { code, statusCode });

export const createReview = async (req, res, next) => {
  try {
    const { sessionId, rating, comment } = req.body;

    const session = await Session.findById(sessionId);
    if (!session || String(session.userId) !== req.user.id) {
      return next(makeError('Session not found', 'SESSION_NOT_FOUND', 404));
    }
    if (session.status !== 'completed') {
      return next(makeError('Session not completed yet', 'SESSION_NOT_COMPLETED', 409));
    }

    const review = await Review.create({
      userId: req.user.id,
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

    success(res, { review }, 201);
  } catch (err) {
    next(err);
  }
};

export const getProfessionalReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ professionalId: req.params.professionalId })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
    success(res, { reviews });
  } catch (err) {
    next(err);
  }
};
