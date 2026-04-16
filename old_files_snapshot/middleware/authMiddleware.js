const jwt = require('jsonwebtoken');

const attachUserFromToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    req.user = null;
  }

  return next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  return next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/login');
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('partials/error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        user: req.user
      });
    }
    return next();
  };
};

module.exports = {
  attachUserFromToken,
  requireAuth,
  requireRole
};