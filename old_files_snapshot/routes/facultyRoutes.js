const express = require('express');
const { body } = require('express-validator');
const {
  showDashboard,
  showMonitor,
  showStudents,
  showFeedback,
  showMarks,
  showAttendance,
  showLeaves,
  showAnalytics,
  showStudentDetails,
  upsertMarks,
  upsertAttendance,
  updateLeaveStatus,
  createStudentFeedback
} = require('../controllers/facultyController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('faculty'));

router.get('/dashboard', showDashboard);
router.get('/monitor', showMonitor);
router.get('/students', showStudents);
router.get('/feedback', showFeedback);
router.get('/students/:studentId', showStudentDetails);
router.get('/marks', showMarks);
router.get('/attendance', showAttendance);
router.get('/leaves', showLeaves);
router.get('/analytics', showAnalytics);

router.post(
  '/marks',
  [
    body('student_id').isInt().withMessage('Student is required.'),
    body('subject').notEmpty().withMessage('Subject is required.'),
    body('internal_marks').isFloat({ min: 0, max: 40 }).withMessage('Internal marks must be 0-40.'),
    body('external_marks')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0, max: 60 })
      .withMessage('External marks must be 0-60.'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.')
  ],
  validateRequest,
  upsertMarks
);

router.post(
  '/attendance',
  [
    body('student_id').isInt().withMessage('Student is required.'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.'),
    body('attendance_percentage').isFloat({ min: 0, max: 100 }).withMessage('Attendance must be 0-100.')
  ],
  validateRequest,
  upsertAttendance
);

router.post(
  '/students/:studentId/feedback',
  [
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Feedback subject is required.')
      .isLength({ max: 150 })
      .withMessage('Feedback subject must be at most 150 characters.'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Feedback message is required.')
      .isLength({ max: 2000 })
      .withMessage('Feedback message must be at most 2000 characters.')
  ],
  validateRequest,
  createStudentFeedback
);

router.post(
  '/leave-status',
  [
    body('leave_id').isInt().withMessage('Leave ID is required.'),
    body('status').isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid leave status.')
  ],
  validateRequest,
  updateLeaveStatus
);

module.exports = router;
