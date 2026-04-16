const express = require('express');
const { body } = require('express-validator');
const {
  showHome,
  showLogin,
  showAboutCollege,
  showContact,
  showDepartments,
  showDepartmentDetail,
  showFacultyDirectory,
  showPlacements,
  login,
  logout
} = require('../controllers/authController');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/', showHome);
router.get('/login', showLogin);
router.get('/about-college', showAboutCollege);
router.get('/departments', showDepartments);
router.get('/departments/:slug', showDepartmentDetail);
router.get('/faculty', showFacultyDirectory);
router.get('/placements', showPlacements);
router.get('/contact', showContact);
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
  ],
  validateRequest,
  login
);
router.get('/logout', logout);

module.exports = router;
