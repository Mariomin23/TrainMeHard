import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Professional from '../models/Professional.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import logger from '../utils/logger.util.js';
import { makeError } from '../utils/errors.util.js';

const SALT_ROUNDS = 12;
const REFRESH_HASH_ROUNDS = 10;

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const issueTokenPair = async (user, res) => {
  const accessToken = signAccessToken({ id: String(user._id), role: user.role });
  const rawRefresh = signRefreshToken(user._id);
  const refreshHash = await bcrypt.hash(rawRefresh, REFRESH_HASH_ROUNDS);

  user.refreshTokenHash = refreshHash;
  await user.save();
  setRefreshCookie(res, rawRefresh);

  return {
    accessToken,
    user: {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
};

export const register = async (data, res) => {
  const { firstName, lastName, email, password, role = 'user', professionalType } = data;

  if (await User.findOne({ email })) {
    throw makeError('Email already registered', 'EMAIL_ALREADY_EXISTS', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ firstName, lastName, email, passwordHash, role });

  if (role === 'professional') {
    await Professional.create({
      userId: user._id,
      professionalType: professionalType || 'trainer',
      sessionPrice: 0,
    });
  }

  logger.info(`User registered: ${email}`);
  return issueTokenPair(user, res);
};

export const login = async ({ email, password }, res) => {
  const user = await User.findOne({ email });
  const hash = user?.passwordHash || user?.password;
  const valid = user && hash && (await bcrypt.compare(password, hash));

  if (!valid) {
    logger.warn(`Failed login: ${email}`);
    throw makeError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
  }

  logger.info(`User logged in: ${email}`);
  return issueTokenPair(user, res);
};

export const refreshTokens = async (rawToken, res) => {
  if (!rawToken) {
    throw makeError('Refresh token missing', 'INVALID_REFRESH_TOKEN', 401);
  }

  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw makeError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }

  const user = await User.findById(payload.id);
  if (!user || !user.refreshTokenHash) {
    throw makeError('Token revoked', 'INVALID_REFRESH_TOKEN', 401);
  }

  const matches = await bcrypt.compare(rawToken, user.refreshTokenHash);
  if (!matches) {
    user.refreshTokenHash = null;
    await user.save();
    logger.warn(`Refresh token reuse detected for user: ${user._id}`);
    throw makeError('Token reuse detected', 'INVALID_REFRESH_TOKEN', 401);
  }

  logger.info(`Tokens refreshed for user: ${user._id}`);
  return issueTokenPair(user, res);
};

export const logout = async (userId, res) => {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  logger.info(`User logged out: ${userId}`);
};
