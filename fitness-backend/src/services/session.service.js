import Session from '../models/Session.model.js';
import Professional from '../models/Professional.model.js';
import { calculateFees } from './payment.service.js';
import logger from '../utils/logger.util.js';
import { makeError } from '../utils/errors.util.js';

export const createSession = async (userId, { professionalId, scheduledAt }) => {
  const professional = await Professional.findOne({ _id: professionalId, isApproved: true });
  if (!professional) throw makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404);

  const { platformFee, professionalPayout } = calculateFees(professional.sessionPrice);

  return Session.create({
    userId,
    professionalId,
    sessionPrice: professional.sessionPrice,
    platformFee,
    professionalPayout,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  });
};

export const prepareCheckout = async (sessionId, userId) => {
  const session = await Session.findById(sessionId).populate('professionalId');
  if (!session) throw makeError('Session not found', 'SESSION_NOT_FOUND', 404);
  if (String(session.userId) !== userId) throw makeError('Forbidden', 'FORBIDDEN', 403);
  if (session.status !== 'pending') throw makeError('Session already processed', 'SESSION_ALREADY_PROCESSED', 409);

  if (!session.professionalId.stripeAccountId) {
    throw makeError('Professional Stripe account not connected', 'STRIPE_ACCOUNT_NOT_CONNECTED', 409);
  }

  return session;
};

export const savePaymentIntent = async (session, paymentIntentId) => {
  session.stripePaymentIntentId = paymentIntentId;
  return session.save();
};

export const getSessionsForUser = async (userId) => {
  return Session.find({ userId })
    .populate('professionalId')
    .sort({ createdAt: -1 });
};

export const getSessionsForProfessional = async (userId) => {
  const prof = await Professional.findOne({ userId });
  if (!prof) throw makeError('Professional profile not found', 'PROFESSIONAL_NOT_FOUND', 404);
  return Session.find({ professionalId: prof._id })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

export const confirmPayment = async (paymentIntentId) => {
  const session = await Session.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    { status: 'paid' },
    { new: true }
  );
  if (session) logger.info(`Payment confirmed for session: ${session._id}`);
  return session;
};
