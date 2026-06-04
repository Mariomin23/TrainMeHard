import Professional from '../models/Professional.model.js';
import stripe from '../config/stripe.js';
import logger from '../utils/logger.util.js';
import { makeError } from '../utils/errors.util.js';
import { env } from '../config/env.js';

export const createOrUpdateProfile = async (userId, data) => {
  const profile = await Professional.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  );
  logger.info(`Professional profile updated: ${userId}`);
  return profile;
};

export const getPublicProfile = async (professionalId) => {
  const profile = await Professional.findOne({ _id: professionalId, isApproved: true })
    .populate('userId', 'firstName lastName avatar');
  if (!profile) throw makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404);
  return profile;
};

export const getProfileByUserId = async (userId) => {
  const profile = await Professional.findOne({ userId })
    .populate('userId', 'firstName lastName email avatar');
  if (!profile) throw makeError('Profile not found', 'PROFESSIONAL_NOT_FOUND', 404);
  return profile;
};

export const approveProfile = async (professionalId) => {
  const profile = await Professional.findByIdAndUpdate(
    professionalId,
    { isApproved: true },
    { new: true }
  );
  if (!profile) throw makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404);
  logger.info(`Professional approved: ${professionalId}`);
  return profile;
};

export const createStripeConnectAccount = async (userId) => {
  const professional = await Professional.findOne({ userId }).populate('userId', 'email');
  if (!professional) throw makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404);

  const frontendUrl = env.CORS_ORIGIN;
  const returnUrl = `${frontendUrl}/dashboard/professional/stripe/return?success=true`;
  const refreshUrl = `${frontendUrl}/dashboard/professional/stripe/return?refresh=true`;

  let accountId = professional.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'ES',
      email: professional.userId.email,
    });
    accountId = account.id;
    await Professional.findByIdAndUpdate(professional._id, { stripeAccountId: accountId });
    logger.info(`Stripe Connect account created: ${accountId} for professional: ${professional._id}`);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return { onboardingUrl: link.url };
};

export const getStripeConnectStatus = async (userId) => {
  const professional = await Professional.findOne({ userId });
  if (!professional) throw makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404);

  if (!professional.stripeAccountId) {
    return { connected: false, detailsSubmitted: false, chargesEnabled: false };
  }

  const account = await stripe.accounts.retrieve(professional.stripeAccountId);
  return {
    connected: true,
    detailsSubmitted: account.details_submitted,
    chargesEnabled: account.charges_enabled,
  };
};
