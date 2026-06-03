import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/utils/jwt.util.js';

describe('jwt.util', () => {
  it('signAccessToken crea token verificable con payload correcto', () => {
    const token = signAccessToken({ id: 'abc123', role: 'user' });
    expect(typeof token).toBe('string');
    const payload = verifyAccessToken(token);
    expect(payload.id).toBe('abc123');
    expect(payload.role).toBe('user');
  });

  it('verifyAccessToken lanza para token inválido', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });

  it('signRefreshToken crea JWT verificable con userId', () => {
    const token = signRefreshToken('user456');
    const payload = verifyRefreshToken(token);
    expect(payload.id).toBe('user456');
  });

  it('verifyRefreshToken lanza para token inválido', () => {
    expect(() => verifyRefreshToken('bad_token')).toThrow();
  });
});
