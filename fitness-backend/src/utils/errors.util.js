export const makeError = (message, code, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });
