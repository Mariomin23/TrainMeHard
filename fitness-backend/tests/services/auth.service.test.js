import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/models/User.model.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../src/models/Professional.model.js', () => ({
  default: { create: vi.fn() },
}));

vi.mock('../../src/utils/logger.util.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import * as authService from '../../src/services/auth.service.js';
import User from '../../src/models/User.model.js';
import bcrypt from 'bcryptjs';

const mockRes = () => {
  const res = { cookie: vi.fn(), clearCookie: vi.fn() };
  return res;
};

describe('auth.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('register', () => {
    it('lanza EMAIL_ALREADY_EXISTS si el email ya existe', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' });
      await expect(authService.register({ firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pass' }, mockRes()))
        .rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS', statusCode: 409 });
    });

    it('crea User y devuelve accessToken + user cuando el email es nuevo', async () => {
      User.findOne.mockResolvedValue(null);
      const fakeUser = {
        _id: 'uid1',
        firstName: 'Ana',
        lastName: 'López',
        email: 'ana@test.com',
        role: 'user',
        refreshTokenHash: null,
        save: vi.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(fakeUser);

      const res = mockRes();
      const result = await authService.register(
        { firstName: 'Ana', lastName: 'López', email: 'ana@test.com', password: 'secret123', role: 'user' },
        res
      );

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('ana@test.com');
      expect(res.cookie).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('lanza INVALID_CREDENTIALS si el usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.login({ email: 'x@x.com', password: 'pw' }, mockRes()))
        .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
    });

    it('lanza INVALID_CREDENTIALS si la contraseña es incorrecta', async () => {
      User.findOne.mockResolvedValue({ passwordHash: await bcrypt.hash('correct', 10) });
      await expect(authService.login({ email: 'x@x.com', password: 'wrong' }, mockRes()))
        .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
    });
  });

  describe('logout', () => {
    it('borra refreshTokenHash y limpia cookie', async () => {
      User.findByIdAndUpdate.mockResolvedValue({});
      const res = mockRes();
      await authService.logout('uid1', res);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('uid1', { refreshTokenHash: null });
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('lanza INVALID_REFRESH_TOKEN si no hay token', async () => {
      await expect(authService.refreshTokens(undefined, mockRes()))
        .rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN', statusCode: 401 });
    });

    it('lanza INVALID_REFRESH_TOKEN si el token JWT es inválido', async () => {
      await expect(authService.refreshTokens('not-a-jwt', mockRes()))
        .rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN', statusCode: 401 });
    });

    it('detecta reutilización de token — borra hash y lanza error', async () => {
      const { signRefreshToken } = await import('../../src/utils/jwt.util.js');
      const rawToken = signRefreshToken('uid99');

      const fakeUser = {
        _id: 'uid99',
        refreshTokenHash: 'some_hash_that_will_not_match',
        save: vi.fn().mockResolvedValue(true),
      };
      User.findById.mockResolvedValue(fakeUser);

      await expect(authService.refreshTokens(rawToken, mockRes()))
        .rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN', statusCode: 401 });

      expect(fakeUser.save).toHaveBeenCalled();
      expect(fakeUser.refreshTokenHash).toBeNull();
    });
  });
});
