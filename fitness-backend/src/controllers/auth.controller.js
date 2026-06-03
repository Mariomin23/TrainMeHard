import * as authService from '../services/auth.service.js';
import { success } from '../utils/apiResponse.util.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, res);
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, res);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshTokens(req.cookies?.refreshToken, res);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id, res);
    success(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};
