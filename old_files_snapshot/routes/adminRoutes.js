const express = require('express');
const { body } = require('express-validator');
const {
  showDashboard,
  showStudents,
  showFaculty,
  showOperations,
  showReports,
  showQueries,
  addStudent,
  editStudent,
  removeStudent,
  addFaculty,
  editFaculty,
  removeFaculty,
  setFacultyForStudent,
  setFeeStatus,
  setSemester,
  setQueryStatus
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', showDashboard);
router.get('/students', showStudents);
router.get('/faculty', showFaculty);
router.get('/operations', showOperations);
router.get('/reports', showReports);
router.get('/queries', showQueries);

router.post(
  '/students',
  [
    body('name').notEmpty().withMessage('Student name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('department').notEmpty().withMessage('Department is required.'),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12.')
  ],
  validateRequest,
  addStudent
);
router.post('/students/:id/edit', editStudent);
router.post('/students/:id/delete', removeStudent);

router.post(
  '/faculty',
  [
    body('name').notEmpty().withMessage('Faculty name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('department').notEmpty().withMessage('Department is required.')
  ],
  validateRequest,
  addFaculty
);
router.post('/faculty/:id/edit', editFaculty);
router.post('/faculty/:id/delete', removeFaculty);

router.post('/assign-faculty', setFacultyForStudent);
router.post('/fees', setFeeStatus);
router.post('/semesters', setSemester);
router.post(
  '/queries/:id/status',
  [body('status').isIn(['Unread', 'Read', 'Resolved']).withMessage('Invalid query status.')],
  validateRequest,
  setQueryStatus
);

module.exports = router;
