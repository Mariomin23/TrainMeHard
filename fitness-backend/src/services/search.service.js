import Professional from '../models/Professional.model.js';

export const searchProfessionals = async ({
  type,
  specialty,
  city,
  minPrice,
  maxPrice,
  minRating,
  page = 1,
  limit = 12,
} = {}) => {
  const filter = { isApproved: true };

  if (type) filter.professionalType = type;
  if (specialty) filter.specialties = specialty;
  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.sessionPrice = {};
    if (minPrice !== undefined) filter.sessionPrice.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.sessionPrice.$lte = Number(maxPrice);
  }
  if (minRating !== undefined) filter.rating = { $gte: Number(minRating) };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [professionals, total] = await Promise.all([
    Professional.find(filter)
      .populate('userId', 'firstName lastName avatar')
      .skip(skip)
      .limit(limitNum)
      .sort({ rating: -1, reviewCount: -1 }),
    Professional.countDocuments(filter),
  ]);

  return { professionals, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
};
