const bcrypt = require('bcrypt');
const {
  getDashboardStats,
  assignFaculty,
  updateFeeStatus,
  upsertSemester,
  getStudentQueries,
  getUnreadQueryCount,
  updateQueryStatus
} = require('../models/adminModel');
const { getAllStudents, createStudent, updateStudent, deleteStudent } = require('../models/studentModel');
const { getAllFaculty, createFaculty, updateFaculty, deleteFaculty } = require('../models/facultyModel');
const {
  isDbUnavailable,
  getFallbackAdminData,
  updateFallbackQueryStatus
} = require('../utils/fallbackData');

const loadAdminData = async () => {
  try {
    const [stats, students, faculty, queries, unreadQueryCount] = await Promise.all([
      getDashboardStats(),
      getAllStudents(),
      getAllFaculty(),
      getStudentQueries(),
      getUnreadQueryCount()
    ]);
    return { stats, students, faculty, queries, unreadQueryCount };
  } catch (error) {
    if (isDbUnavailable(error)) {
      return getFallbackAdminData();
    }
    throw error;
  }
};

const renderAdminPage = async (req, res, next, view, title, activeSection) => {
  try {
    const data = await loadAdminData();
    return res.render(view, {
      title,
      user: req.user,
      activeSection,
      ...data
    });
  } catch (error) {
    return next(error);
  }
};

const showDashboard = (req, res, next) => renderAdminPage(req, res, next, 'admin/dashboard', 'Admin Dashboard', 'overview');
const showStudents = (req, res, next) => renderAdminPage(req, res, next, 'admin/students', 'Manage Students', 'students');
const showFaculty = (req, res, next) => renderAdminPage(req, res, next, 'admin/faculty', 'Manage Faculty', 'faculty');
const showOperations = (req, res, next) => renderAdminPage(req, res, next, 'admin/operations', 'Admin Operations', 'operations');
const showReports = (req, res, next) => renderAdminPage(req, res, next, 'admin/reports', 'Admin Reports', 'reports');
const showQueries = (req, res, next) => renderAdminPage(req, res, next, 'admin/queries', 'Student Queries', 'queries');

const redirectBack = (req, res, fallback) => {
  const to = req.get('referer') || fallback;
  return res.redirect(to);
};

const addStudent = async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await createStudent({ ...req.body, hashedPassword });
    return redirectBack(req, res, '/admin/students');
  } catch (error) {
    return next(error);
  }
};

const editStudent = async (req, res, next) => {
  try {
    await updateStudent(req.params.id, req.body);
    return redirectBack(req, res, '/admin/students');
  } catch (error) {
    return next(error);
  }
};

const removeStudent = async (req, res, next) => {
  try {
    await deleteStudent(req.params.id);
    return redirectBack(req, res, '/admin/students');
  } catch (error) {
    return next(error);
  }
};

const addFaculty = async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await createFaculty({ ...req.body, hashedPassword });
    return redirectBack(req, res, '/admin/faculty');
  } catch (error) {
    return next(error);
  }
};

const editFaculty = async (req, res, next) => {
  try {
    await updateFaculty(req.params.id, req.body.department);
    return redirectBack(req, res, '/admin/faculty');
  } catch (error) {
    return next(error);
  }
};

const removeFaculty = async (req, res, next) => {
  try {
    await deleteFaculty(req.params.id);
    return redirectBack(req, res, '/admin/faculty');
  } catch (error) {
    return next(error);
  }
};

const setFacultyForStudent = async (req, res, next) => {
  try {
    await assignFaculty(req.body.student_id, req.body.faculty_id);
    return redirectBack(req, res, '/admin/operations');
  } catch (error) {
    return next(error);
  }
};

const setFeeStatus = async (req, res, next) => {
  try {
    await updateFeeStatus(req.body.student_id, req.body.semester, req.body.amount, req.body.status);
    return redirectBack(req, res, '/admin/operations');
  } catch (error) {
    return next(error);
  }
};

const setSemester = async (req, res, next) => {
  try {
    await upsertSemester(req.body.semester_number, req.body.academic_year);
    return redirectBack(req, res, '/admin/operations');
  } catch (error) {
    return next(error);
  }
};

const setQueryStatus = async (req, res, next) => {
  try {
    await updateQueryStatus(req.params.id, req.body.status);
    return redirectBack(req, res, '/admin/queries');
  } catch (error) {
    if (isDbUnavailable(error)) {
      updateFallbackQueryStatus(req.params.id, req.body.status);
      return redirectBack(req, res, '/admin/queries');
    }
    return next(error);
  }
};

module.exports = {
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
};
