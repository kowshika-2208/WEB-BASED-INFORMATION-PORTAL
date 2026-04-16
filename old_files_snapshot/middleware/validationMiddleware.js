const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).render('partials/error', {
    title: 'Validation Error',
    message: errors.array().map((e) => e.msg).join(' | '),
    user: req.user || null
  });
};

module.exports = { validateRequest };