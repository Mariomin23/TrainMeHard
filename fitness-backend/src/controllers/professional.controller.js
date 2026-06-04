import * as professionalService from '../services/professional.service.js';
import * as searchService from '../services/search.service.js';
import { success } from '../utils/apiResponse.util.js';

export const search = async (req, res, next) => {
  try {
    const result = await searchService.searchProfessionals(req.query);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const professional = await professionalService.getPublicProfile(req.params.id);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const professional = await professionalService.getProfileByUserId(req.user.id);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const professional = await professionalService.createOrUpdateProfile(req.user.id, req.body);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};

export const approveProfile = async (req, res, next) => {
  try {
    const professional = await professionalService.approveProfile(req.params.id);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};

export const connectStripe = async (req, res, next) => {
  try {
    const result = await professionalService.createStripeConnectAccount(req.user.id);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const stripeStatus = async (req, res, next) => {
  try {
    const status = await professionalService.getStripeConnectStatus(req.user.id);
    success(res, status);
  } catch (err) {
    next(err);
  }
};
