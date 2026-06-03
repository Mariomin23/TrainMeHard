import * as sessionService from '../services/session.service.js';
import { createPaymentIntent, constructWebhookEvent } from '../services/payment.service.js';
import { success } from '../utils/apiResponse.util.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.util.js';

export const createSession = async (req, res, next) => {
  try {
    const session = await sessionService.createSession(req.user.id, req.body);
    success(res, { session }, 201);
  } catch (err) {
    next(err);
  }
};

export const checkout = async (req, res, next) => {
  try {
    const session = await sessionService.prepareCheckout(req.params.id, req.user.id);

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      session._id,
      session.sessionPrice,
      session.professionalId.stripeAccountId
    );

    await sessionService.savePaymentIntent(session, paymentIntentId);
    success(res, { clientSecret });
  } catch (err) {
    next(err);
  }
};

export const getMySessions = async (req, res, next) => {
  try {
    const sessions = req.user.role === 'professional'
      ? await sessionService.getSessionsForProfessional(req.user.id)
      : await sessionService.getSessionsForUser(req.user.id);
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
    await sessionService.confirmPayment(event.data.object.id);
  }

  res.json({ received: true });
};
