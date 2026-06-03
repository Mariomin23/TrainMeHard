export const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

export const error = (res, code, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, error: { code, message, statusCode } });
