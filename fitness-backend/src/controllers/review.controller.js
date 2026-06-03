import * as reviewService from '../services/review.service.js';
import { success } from '../utils/apiResponse.util.js';

export const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user.id, req.body);
    success(res, { review }, 201);
  } catch (err) {
    next(err);
  }
};

export const getProfessionalReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getReviewsByProfessional(req.params.professionalId);
    success(res, { reviews });
  } catch (err) {
    next(err);
  }
};
