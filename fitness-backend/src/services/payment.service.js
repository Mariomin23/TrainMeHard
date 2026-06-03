import stripe from '../config/stripe.js';
import { eurToCents } from '../utils/priceFormatter.util.js';
import logger from '../utils/logger.util.js';

const COMMISSION_RATE = 0.5;

export const calculateFees = (sessionPrice) => {
  const platformFee = +(sessionPrice * COMMISSION_RATE).toFixed(2);
  const professionalPayout = +(sessionPrice - platformFee).toFixed(2);
  return { platformFee, professionalPayout };
};

export const createPaymentIntent = async (sessionId, sessionPrice, stripeAccountId) => {
  const amountCents = eurToCents(sessionPrice);
  const applicationFeeCents = eurToCents(sessionPrice * COMMISSION_RATE);

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: stripeAccountId },
    metadata: { sessionId: String(sessionId) },
    automatic_payment_methods: { enabled: true },
  });

  logger.info(`PaymentIntent created: ${intent.id} for session: ${sessionId}`);
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
};

export const constructWebhookEvent = (payload, signature, secret) =>
  stripe.webhooks.constructEvent(payload, signature, secret);
