const db = require('../config/db');
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
  getFallbackFacultyMarksEntries,
  updateFallbackQueryStatus
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

const loadAdminData = async () => {
  try {
    const [stats, students, faculty, queries, unreadQueryCount] = await Promise.all([
      getDashboardStats(),
      getAllStudents(),
      getAllFaculty(),
      getStudentQueries(),
      getUnreadQueryCount()
    ]);
    return {
      stats,
      students: students.map((student) => ({
        ...student,
        batch: getBatchLabelFromSemester(student.semester)
      })),
      faculty,
      queries,
      unreadQueryCount
    };
  } catch (error) {
    if (isDbUnavailable(error)) {
      const fallbackData = getFallbackAdminData();
      return {
        ...fallbackData,
        students: (fallbackData.students || []).map((student) => ({
          ...student,
          batch: getBatchLabelFromSemester(student.semester)
        }))
      };
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
const showBatches = async (req, res, next) => {
  try {
    const data = await loadAdminData();

    let marksEntries = [];
    try {
      [marksEntries] = await db.execute(
        `SELECT student_id, semester, subject, internal_marks, external_marks
         FROM marks
         ORDER BY semester, student_id, subject`
      );
    } catch (error) {
      if (isDbUnavailable(error)) {
        marksEntries = getFallbackFacultyMarksEntries();
      } else {
        throw error;
      }
    }

    const adminStudents = (data.students || []).map((student) => ({
      ...student,
      student_id: student.id
    }));
    const batchDashboard = buildBatchDashboardData(adminStudents, marksEntries);

    return res.render('admin/batches', {
      title: 'Admin Batches',
      user: req.user,
      activeSection: 'batches',
      data: {
        ...data,
        marksEntries,
        ...batchDashboard
      }
    });
  } catch (error) {
    return next(error);
  }
};
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
  showBatches,
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
