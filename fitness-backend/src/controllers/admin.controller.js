import * as adminService from '../services/admin.service.js';
import * as professionalService from '../services/professional.service.js';
import { success } from '../utils/apiResponse.util.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getStats();
    success(res, stats);
  } catch (err) {
    next(err);
  }
};

export const getProfessionals = async (req, res, next) => {
  try {
    const result = await adminService.getProfessionals(req.query);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const approveProfessional = async (req, res, next) => {
  try {
    const professional = await professionalService.approveProfile(req.params.id);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};

export const getAllSessions = async (req, res, next) => {
  try {
    const result = await adminService.getAllSessions(req.query);
    success(res, result);
  } catch (err) {
    next(err);
  }
};
