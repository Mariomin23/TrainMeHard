import Session from '../models/Session.model.js';
import Professional from '../models/Professional.model.js';
import { calculateFees, createPaymentIntent, constructWebhookEvent } from '../services/payment.service.js';
import { success } from '../utils/apiResponse.util.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.util.js';

const makeError = (msg, code, statusCode) =>
  Object.assign(new Error(msg), { code, statusCode });

export const createSession = async (req, res, next) => {
  try {
    const { professionalId, scheduledAt } = req.body;

    const professional = await Professional.findOne({ _id: professionalId, isApproved: true });
    if (!professional) return next(makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404));

    const { platformFee, professionalPayout } = calculateFees(professional.sessionPrice);

    const session = await Session.create({
      userId: req.user.id,
      professionalId,
      sessionPrice: professional.sessionPrice,
      platformFee,
      professionalPayout,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    success(res, { session }, 201);
  } catch (err) {
    next(err);
  }
};

export const checkout = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).populate('professionalId');
    if (!session) return next(makeError('Session not found', 'SESSION_NOT_FOUND', 404));
    if (String(session.userId) !== req.user.id) return next(makeError('Forbidden', 'FORBIDDEN', 403));
    if (session.status !== 'pending') return next(makeError('Session already processed', 'SESSION_ALREADY_PROCESSED', 409));

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      session._id,
      session.sessionPrice,
      session.professionalId.stripeAccountId
    );

    session.stripePaymentIntentId = paymentIntentId;
    await session.save();

    success(res, { clientSecret });
  } catch (err) {
    next(err);
  }
};

export const getMySessions = async (req, res, next) => {
  try {
    let sessions;
    if (req.user.role === 'professional') {
      const prof = await Professional.findOne({ userId: req.user.id });
      sessions = await Session.find({ professionalId: prof?._id })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else {
      sessions = await Session.find({ userId: req.user.id })
        .populate('professionalId')
        .sort({ createdAt: -1 });
    }
    success(res, { sessions });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = constructWebhookEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn(`Webhook signature failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const session = await Session.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: 'paid' },
      { new: true }
    );
    if (session) logger.info(`Payment confirmed for session: ${session._id}`);
  }

  res.json({ received: true });
};
