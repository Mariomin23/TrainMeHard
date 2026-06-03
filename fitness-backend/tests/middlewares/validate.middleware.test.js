import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../../src/middlewares/validate.middleware.js';

const mockReqRes = (body = {}) => {
  const req = { body };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
};

describe('validate middleware', () => {
  const schema = z.object({ name: z.string().min(1), age: z.number() });

  it('llama next() con body válido', () => {
    const { req, res, next } = mockReqRes({ name: 'Ana', age: 25 });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ana', age: 25 });
  });

  it('llama next(error) con body inválido', () => {
    const { req, res, next } = mockReqRes({ name: '' });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
