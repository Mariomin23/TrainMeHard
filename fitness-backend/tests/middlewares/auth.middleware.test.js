import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from '../../src/middlewares/auth.middleware.js';
import { signAccessToken } from '../../src/utils/jwt.util.js';

const mockReqRes = (authHeader = '') => {
  const req = { headers: { authorization: authHeader } };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
};

describe('requireAuth middleware', () => {
  it('llama next() con token válido y cuelga req.user', () => {
    const token = signAccessToken({ id: 'u1', role: 'user' });
    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'u1', role: 'user' });
  });

  it('responde 401 sin header Authorization', () => {
    const { req, res, next } = mockReqRes('');
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 con token inválido', () => {
    const { req, res, next } = mockReqRes('Bearer bad.token.here');
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
