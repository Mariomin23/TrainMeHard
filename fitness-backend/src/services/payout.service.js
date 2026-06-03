import stripe from '../config/stripe.js';
import { eurToCents } from '../utils/priceFormatter.util.js';
import logger from '../utils/logger.util.js';

export const createTransfer = async (stripeAccountId, amountEur, sessionId) => {
  const transfer = await stripe.transfers.create({
    amount: eurToCents(amountEur),
    currency: 'eur',
    destination: stripeAccountId,
    metadata: { sessionId: String(sessionId) },
  });
  logger.info(`Transfer created: ${transfer.id} to: ${stripeAccountId}`);
  return transfer;
};
