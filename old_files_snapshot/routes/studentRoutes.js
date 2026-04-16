const express = require('express');
const { body } = require('express-validator');
const {
  showOverview,
  showAcademics,
  showPersonal,
  showFees,
  showLeaves,
  showHallTicketPage,
  applyLeave,
  submitQuery,
  downloadHallTicket
} = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('student'));

router.get('/dashboard', showOverview);
router.get('/academics', showAcademics);
router.get('/personal', showPersonal);
router.get('/fees', showFees);
router.get('/leaves', showLeaves);
router.get('/hall-ticket', showHallTicketPage);

router.post(
  '/leave',
  [
    body('reason').notEmpty().withMessage('Leave reason is required.'),
    body('from_date').isISO8601().withMessage('From date is invalid.'),
    body('to_date').isISO8601().withMessage('To date is invalid.')
  ],
  validateRequest,
  applyLeave
);

router.post(
  '/query',
  [
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Query subject is required.')
      .isLength({ max: 150 })
      .withMessage('Query subject must be at most 150 characters.'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Query message is required.')
      .isLength({ max: 2000 })
      .withMessage('Query message must be at most 2000 characters.')
  ],
  validateRequest,
  submitQuery
);

router.get('/hall-ticket/download', downloadHallTicket);

module.exports = router;
