import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../../src/middlewares/rbac.middleware.js';

const mockReqRes = (role = null) => {
  const req = { user: role ? { id: 'u1', role } : undefined };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
};

describe('requireRole middleware', () => {
  it('llama next() cuando el rol está en la lista', () => {
    const { req, res, next } = mockReqRes('admin');
    requireRole('admin', 'super_admin')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('responde 403 cuando el rol no está en la lista', () => {
    const { req, res, next } = mockReqRes('user');
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('responde 401 sin req.user', () => {
    const { req, res, next } = mockReqRes(null);
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
