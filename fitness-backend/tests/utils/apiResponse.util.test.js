import { describe, it, expect, vi } from 'vitest';
import { success, error } from '../../src/utils/apiResponse.util.js';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('apiResponse.util', () => {
  it('success responde con 200 y success:true por defecto', () => {
    const res = mockRes();
    success(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('success responde con statusCode custom', () => {
    const res = mockRes();
    success(res, {}, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('error responde con success:false y código de error', () => {
    const res = mockRes();
    error(res, 'NOT_FOUND', 'Resource not found', 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found', statusCode: 404 },
    });
  });
});
