import User from '../models/User.model.js';
import Professional from '../models/Professional.model.js';
import Session from '../models/Session.model.js';

export const getStats = async () => {
  const [totalUsers, totalProfessionals, pendingApprovals, totalSessions, revenueAgg] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Professional.countDocuments(),
      Professional.countDocuments({ isApproved: false }),
      Session.countDocuments(),
      Session.aggregate([
        { $match: { status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } },
      ]),
    ]);

  return {
    totalUsers,
    totalProfessionals,
    pendingApprovals,
    totalSessions,
    totalRevenue: revenueAgg[0]?.total ?? 0,
  };
};

export const getProfessionals = async ({ status = 'all', page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (status === 'pending') filter.isApproved = false;
  if (status === 'approved') filter.isApproved = true;

  const skip = (Number(page) - 1) * Number(limit);

  const [professionals, total] = await Promise.all([
    Professional.find(filter)
      .populate('userId', 'firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Professional.countDocuments(filter),
  ]);

  return { professionals, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};

export const getAllSessions = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);

  const [sessions, total] = await Promise.all([
    Session.find()
      .populate('userId', 'firstName lastName email')
      .populate({ path: 'professionalId', populate: { path: 'userId', select: 'firstName lastName' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Session.countDocuments(),
  ]);

  return { sessions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};
