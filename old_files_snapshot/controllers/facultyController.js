const db = require('../config/db');
const {
  getFacultyByUserId,
  getFacultyDashboard,
  getFacultyMarksEntries,
  getFacultyAttendanceEntries,
  getFacultyStudentDetails,
  addFacultyFeedback
} = require('../models/facultyModel');
const {
  isDbUnavailable,
  getFallbackFacultyData,
  getFallbackFacultyMarksEntries,
  getFallbackFacultyAttendanceEntries,
  upsertFallbackMark,
  upsertFallbackAttendance,
  updateFallbackLeaveStatus,
  getFallbackFacultyStudentDetails,
  submitFallbackFacultyFeedback
} = require('../utils/fallbackData');

const loadFacultyData = async (req, res) => {
  let faculty;
  try {
    faculty = await getFacultyByUserId(req.user.id);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return {
        faculty: { id: 201, department: 'Computer Science' },
        data: getFallbackFacultyData()
      };
    }
    throw error;
  }
  if (!faculty) {
    res.status(404).render('partials/error', {
      title: 'Not Found',
      message: 'Faculty record was not found.',
      user: req.user
    });
    return null;
  }

  let data;
  try {
    data = await getFacultyDashboard(faculty.id);
  } catch (error) {
    if (isDbUnavailable(error)) {
      data = getFallbackFacultyData();
    } else {
      throw error;
    }
  }
  return { faculty, data };
};

const renderFacultyPage = async (req, res, next, view, title, activeSection) => {
  try {
    const loaded = await loadFacultyData(req, res);
    if (!loaded) return;

    return res.render(view, {
      title,
      user: req.user,
      data: loaded.data,
      activeSection
    });
  } catch (error) {
    return next(error);
  }
};

const showDashboard = (req, res, next) => renderFacultyPage(req, res, next, 'faculty/dashboard', 'Faculty Dashboard', 'overview');
const showMonitor = (req, res, next) => renderFacultyPage(req, res, next, 'faculty/dashboard', 'Faculty Monitor', 'monitor');
const showStudents = (req, res, next) => renderFacultyPage(req, res, next, 'faculty/students', 'Assigned Students', 'students');
const showMarks = async (req, res, next) => {
  try {
    const loaded = await loadFacultyData(req, res);
    if (!loaded) return;

    let marksEntries = [];
    try {
      marksEntries = await getFacultyMarksEntries(loaded.faculty.id);
    } catch (error) {
      if (isDbUnavailable(error)) {
        marksEntries = getFallbackFacultyMarksEntries();
      } else {
        throw error;
      }
    }

    return res.render('faculty/marks', {
      title: 'Marks Entry',
      user: req.user,
      data: { ...loaded.data, marksEntries },
      activeSection: 'marks'
    });
  } catch (error) {
    return next(error);
  }
};
const showAttendance = async (req, res, next) => {
  try {
    const loaded = await loadFacultyData(req, res);
    if (!loaded) return;

    let attendanceEntries = [];
    try {
      attendanceEntries = await getFacultyAttendanceEntries(loaded.faculty.id);
    } catch (error) {
      if (isDbUnavailable(error)) {
        attendanceEntries = getFallbackFacultyAttendanceEntries();
      } else {
        throw error;
      }
    }

    return res.render('faculty/attendance', {
      title: 'Attendance Entry',
      user: req.user,
      data: { ...loaded.data, attendanceEntries },
      activeSection: 'attendance'
    });
  } catch (error) {
    return next(error);
  }
};
const showLeaves = (req, res, next) => renderFacultyPage(req, res, next, 'faculty/leaves', 'Leave Management', 'leaves');
const showAnalytics = (req, res, next) => renderFacultyPage(req, res, next, 'faculty/analytics', 'Performance Analytics', 'analytics');

const showStudentDetails = async (req, res, next) => {
  try {
    let faculty;
    try {
      faculty = await getFacultyByUserId(req.user.id);
    } catch (error) {
      if (isDbUnavailable(error)) {
        const details = getFallbackFacultyStudentDetails(req.params.studentId);
        if (!details) {
          return res.status(404).render('partials/error', {
            title: 'Student Not Found',
            message: 'Student not found under your mentorship.',
            user: req.user
          });
        }
        return res.render('faculty/student-details', {
          title: 'Student Details',
          user: req.user,
          activeSection: 'students',
          details
        });
      }
      throw error;
    }
    if (!faculty) {
      return res.status(404).render('partials/error', {
        title: 'Not Found',
        message: 'Faculty record was not found.',
        user: req.user
      });
    }

    let details;
    try {
      details = await getFacultyStudentDetails(faculty.id, req.params.studentId);
    } catch (error) {
      if (isDbUnavailable(error)) {
        details = getFallbackFacultyStudentDetails(req.params.studentId);
      } else {
        throw error;
      }
    }
    if (!details) {
      return res.status(404).render('partials/error', {
        title: 'Student Not Found',
        message: 'Student not found under your mentorship.',
        user: req.user
      });
    }

    return res.render('faculty/student-details', {
      title: 'Student Details',
      user: req.user,
      activeSection: 'students',
      details
    });
  } catch (error) {
    return next(error);
  }
};

const upsertMarks = async (req, res, next) => {
  try {
    const { student_id, subject, internal_marks, external_marks, semester } = req.body;
    const [rows] = await db.execute(
      'SELECT id, external_marks FROM marks WHERE student_id = ? AND subject = ? AND semester = ?',
      [student_id, subject, semester]
    );

    const normalizedExternal =
      external_marks === undefined || external_marks === null || external_marks === ''
        ? null
        : Number(external_marks);

    if (rows[0]) {
      const nextExternal = normalizedExternal === null ? rows[0].external_marks : normalizedExternal;
      await db.execute(
        'UPDATE marks SET internal_marks = ?, external_marks = ? WHERE id = ?',
        [internal_marks, nextExternal, rows[0].id]
      );
    } else {
      await db.execute(
        'INSERT INTO marks (student_id, subject, internal_marks, external_marks, semester) VALUES (?, ?, ?, ?, ?)',
        [student_id, subject, internal_marks, normalizedExternal === null ? 0 : normalizedExternal, semester]
      );
    }

    return res.redirect('/faculty/marks');
  } catch (error) {
    if (isDbUnavailable(error)) {
      const { student_id, subject, internal_marks, external_marks, semester } = req.body;
      upsertFallbackMark(student_id, subject, internal_marks, external_marks, semester);
      return res.redirect('/faculty/marks');
    }
    return next(error);
  }
};

const upsertAttendance = async (req, res, next) => {
  try {
    const { student_id, semester, attendance_percentage } = req.body;
    const [rows] = await db.execute('SELECT id FROM attendance WHERE student_id = ? AND semester = ?', [student_id, semester]);
    if (rows[0]) {
      await db.execute('UPDATE attendance SET attendance_percentage = ? WHERE id = ?', [attendance_percentage, rows[0].id]);
    } else {
      await db.execute(
        'INSERT INTO attendance (student_id, semester, attendance_percentage) VALUES (?, ?, ?)',
        [student_id, semester, attendance_percentage]
      );
    }

    return res.redirect('/faculty/attendance');
  } catch (error) {
    if (isDbUnavailable(error)) {
      const { student_id, semester, attendance_percentage } = req.body;
      upsertFallbackAttendance(student_id, semester, attendance_percentage);
      return res.redirect('/faculty/attendance');
    }
    return next(error);
  }
};

const updateLeaveStatus = async (req, res, next) => {
  try {
    const { leave_id, status } = req.body;
    await db.execute('UPDATE leaves SET status = ? WHERE id = ?', [status, leave_id]);
    return res.redirect('/faculty/leaves');
  } catch (error) {
    if (isDbUnavailable(error)) {
      const { leave_id, status } = req.body;
      updateFallbackLeaveStatus(leave_id, status);
      return res.redirect('/faculty/leaves');
    }
    return next(error);
  }
};

const createStudentFeedback = async (req, res, next) => {
  try {
    let faculty;
    try {
      faculty = await getFacultyByUserId(req.user.id);
    } catch (error) {
      if (isDbUnavailable(error)) {
        submitFallbackFacultyFeedback(req.params.studentId, req.body.subject, req.body.message);
        return res.redirect(`/faculty/students/${req.params.studentId}`);
      }
      throw error;
    }

    if (!faculty) {
      return res.status(404).render('partials/error', {
        title: 'Not Found',
        message: 'Faculty record was not found.',
        user: req.user
      });
    }

    const inserted = await addFacultyFeedback(faculty.id, req.params.studentId, req.body.subject, req.body.message);
    if (!inserted) {
      return res.status(404).render('partials/error', {
        title: 'Student Not Found',
        message: 'Student not found under your mentorship.',
        user: req.user
      });
    }

    return res.redirect(`/faculty/students/${req.params.studentId}`);
  } catch (error) {
    if (isDbUnavailable(error)) {
      submitFallbackFacultyFeedback(req.params.studentId, req.body.subject, req.body.message);
      return res.redirect(`/faculty/students/${req.params.studentId}`);
    }
    return next(error);
  }
};

module.exports = {
  showDashboard,
  showMonitor,
  showStudents,
  showMarks,
  showAttendance,
  showLeaves,
  showAnalytics,
  showStudentDetails,
  upsertMarks,
  upsertAttendance,
  updateLeaveStatus,
  createStudentFeedback
};
