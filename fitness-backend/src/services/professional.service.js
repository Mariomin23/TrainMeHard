import Professional from '../models/Professional.model.js';
import logger from '../utils/logger.util.js';

const makeError = (message, code, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

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
