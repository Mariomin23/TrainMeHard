import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_SECRET);

export const signRefreshToken = (userId) =>
  jwt.sign({ id: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_SECRET);
