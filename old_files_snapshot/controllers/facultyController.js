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

const getBatchLabelFromSemester = (semester) => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - Math.floor((Number(semester || 1) - 1) / 2);
  return `${startYear}-${startYear + 4}`;
};

const getResidenceType = (studentId) => (Number(studentId) % 3 === 0 ? 'Hosteller' : 'Day Scholar');

const getPlacementProjection = (student, rankInBatch) => {
  const companyPool = ['Google', 'Microsoft', 'Amazon', 'Cisco', 'Zoho', 'Infosys', 'TCS', 'Deloitte'];
  const semester = Number(student.semester || 1);
  const cgpa = Number(student.cgpa_overall || 0);
  const isPlaced = semester >= 5 && (cgpa >= 8.2 || rankInBatch <= 3);

  if (!isPlaced) {
    return {
      status: semester >= 5 ? 'Placement Training' : 'Placement Pipeline',
      company: '-',
      packageLpa: null
    };
  }

  const company = companyPool[(Number(student.student_id) + rankInBatch) % companyPool.length];
  const packageLpa = +(6 + (cgpa - 7) * 3 + Math.max(0, 4 - rankInBatch) * 1.2).toFixed(1);

  return {
    status: 'Placed',
    company,
    packageLpa
  };
};

const buildBatchDashboardData = (students = [], marksEntries = []) => {
  const studentMarksMap = new Map();
  marksEntries.forEach((row) => {
    const key = Number(row.student_id);
    if (!studentMarksMap.has(key)) studentMarksMap.set(key, []);
    studentMarksMap.get(key).push(row);
  });

  const batchMap = new Map();

  students.forEach((student) => {
    const batch = getBatchLabelFromSemester(student.semester);
    const marks = studentMarksMap.get(Number(student.student_id)) || [];
    const arrearCount = marks.filter((row) => (Number(row.internal_marks || 0) + Number(row.external_marks || 0)) < 48).length;
    const noHistoryOfArrear = arrearCount === 0;

    if (!batchMap.has(batch)) batchMap.set(batch, []);
    batchMap.get(batch).push({
      ...student,
      batch,
      residenceType: getResidenceType(student.student_id),
      arrearCount,
      noHistoryOfArrear
    });
  });

  const batchDetails = Array.from(batchMap.entries())
    .sort((a, b) => String(b[0]).localeCompare(String(a[0])))
    .map(([batch, rows]) => {
      const rankedStudents = rows
        .slice()
        .sort((a, b) => Number(b.cgpa_overall || 0) - Number(a.cgpa_overall || 0) || String(a.name).localeCompare(String(b.name)))
        .map((student, index) => {
          const placement = getPlacementProjection(student, index + 1);
          return {
            ...student,
            batchRank: index + 1,
            placementStatus: placement.status,
            company: placement.company,
            packageLpa: placement.packageLpa
          };
        });

      const departmentBreakdown = Array.from(
        rankedStudents.reduce((map, student) => {
          if (!map.has(student.department)) {
            map.set(student.department, {
              department: student.department,
              totalStudents: 0,
              placedCount: 0,
              totalCgpa: 0,
              arrearCount: 0,
              hostellers: 0,
              dayScholars: 0
            });
          }

          const row = map.get(student.department);
          row.totalStudents += 1;
          row.totalCgpa += Number(student.cgpa_overall || 0);
          row.arrearCount += Number(student.arrearCount || 0);
          if (student.placementStatus === 'Placed') row.placedCount += 1;
          if (student.residenceType === 'Hosteller') row.hostellers += 1;
          else row.dayScholars += 1;
          return map;
        }, new Map()).values()
      ).map((row) => ({
        ...row,
        avgCgpa: +(row.totalCgpa / Math.max(1, row.totalStudents)).toFixed(2),
        placementRate: +((row.placedCount * 100) / Math.max(1, row.totalStudents)).toFixed(1)
      }));

      const placedCount = rankedStudents.filter((student) => student.placementStatus === 'Placed').length;
      const hostellers = rankedStudents.filter((student) => student.residenceType === 'Hosteller').length;
      const dayScholars = rankedStudents.length - hostellers;
      const arrearFreeCount = rankedStudents.filter((student) => student.noHistoryOfArrear).length;
      const totalArrears = rankedStudents.reduce((sum, student) => sum + Number(student.arrearCount || 0), 0);

      return {
        batch,
        totalStudents: rankedStudents.length,
        placedCount,
        placementRate: +((placedCount * 100) / Math.max(1, rankedStudents.length)).toFixed(1),
        avgCgpa: +(rankedStudents.reduce((sum, student) => sum + Number(student.cgpa_overall || 0), 0) / Math.max(1, rankedStudents.length)).toFixed(2),
        hostellers,
        dayScholars,
        arrearFreeCount,
        totalArrears,
        departmentBreakdown,
        topRankedStudents: rankedStudents.slice(0, 5),
        students: rankedStudents
      };
    });

  const batchSummaries = batchDetails.map((batch) => ({
    batch: batch.batch,
    totalStudents: batch.totalStudents,
    departments: batch.departmentBreakdown.length,
    placedCount: batch.placedCount,
    placementRate: batch.placementRate,
    avgCgpa: batch.avgCgpa,
    hostellers: batch.hostellers,
    dayScholars: batch.dayScholars,
    arrearFreeCount: batch.arrearFreeCount,
    totalArrears: batch.totalArrears
  }));

  return { batchSummaries, batchDetails };
};

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
const showMonitor = (req, res, next) => renderFacultyPage(req, res, next, 'faculty/monitor', 'Faculty Monitor', 'monitor');
const showStudents = (req, res, next) => renderFacultyPage(req, res, next, 'faculty/students', 'Assigned Students', 'students');
const showFeedback = (req, res, next) => renderFacultyPage(req, res, next, 'faculty/feedback', 'Faculty Feedback', 'feedback');
const showBatches = async (req, res, next) => {
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

    const batchDashboard = buildBatchDashboardData(loaded.data.students || [], marksEntries);

    return res.render('faculty/batches', {
      title: 'Faculty Batches',
      user: req.user,
      data: {
        ...loaded.data,
        marksEntries,
        ...batchDashboard
      },
      activeSection: 'batches'
    });
  } catch (error) {
    return next(error);
  }
};
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
  showFeedback,
  showBatches,
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
