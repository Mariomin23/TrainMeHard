export const validate = (schema, target = 'body') => (req, res, next) => {
  try {
    req[target] = schema.parse(req[target]);
    next();
  } catch (err) {
    next(err);
  }
};
