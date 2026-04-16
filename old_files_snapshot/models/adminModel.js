const db = require('../config/db');

const getDashboardStats = async () => {
  const [[studentCount]] = await db.execute('SELECT COUNT(*) AS total FROM students');
  const [[deptCount]] = await db.execute('SELECT COUNT(DISTINCT department) AS total FROM students');
  const [[passPercent]] = await db.execute(
    `SELECT ROUND((SUM(CASE WHEN cgpa_overall >= 5.0 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0), 2) AS pass_percentage
     FROM students`
  );

  const [departmentBreakdown] = await db.execute(
    `SELECT department, COUNT(*) AS total
     FROM students
     GROUP BY department
     ORDER BY total DESC`
  );

  const [performance] = await db.execute(
    `SELECT semester, ROUND(AVG(cgpa_overall), 2) AS avg_cgpa
     FROM students
     GROUP BY semester
     ORDER BY semester`
  );

  return {
    studentCount: studentCount.total,
    deptCount: deptCount.total,
    passPercentage: passPercent.pass_percentage || 0,
    departmentBreakdown,
    performance
  };
};

const assignFaculty = async (studentId, facultyId) => {
  await db.execute('UPDATE students SET faculty_id = ? WHERE id = ?', [facultyId || null, studentId]);
};

const updateFeeStatus = async (studentId, semester, amount, status) => {
  const [rows] = await db.execute('SELECT id FROM fees WHERE student_id = ? AND semester = ?', [studentId, semester]);
  if (rows[0]) {
    await db.execute('UPDATE fees SET amount = ?, status = ? WHERE id = ?', [amount, status, rows[0].id]);
  } else {
    await db.execute('INSERT INTO fees (student_id, semester, amount, status) VALUES (?, ?, ?, ?)', [studentId, semester, amount, status]);
  }
};

const upsertSemester = async (semesterNumber, academicYear) => {
  const [rows] = await db.execute('SELECT id FROM semesters WHERE semester_number = ? AND academic_year = ?', [semesterNumber, academicYear]);
  if (!rows[0]) {
    await db.execute('INSERT INTO semesters (semester_number, academic_year) VALUES (?, ?)', [semesterNumber, academicYear]);
  }
};

const getStudentQueries = async () => {
  const [rows] = await db.execute(
    `SELECT q.id, q.subject, q.message, q.status, q.created_at,
            s.id AS student_id, u.name AS student_name, u.email AS student_email, s.department, s.semester
     FROM student_queries q
     JOIN students s ON s.id = q.student_id
     JOIN users u ON u.id = s.user_id
     ORDER BY q.id DESC`
  );
  return rows;
};

const getUnreadQueryCount = async () => {
  const [[row]] = await db.execute(
    "SELECT COUNT(*) AS total FROM student_queries WHERE status = 'Unread'"
  );
  return row.total || 0;
};

const updateQueryStatus = async (id, status) => {
  await db.execute('UPDATE student_queries SET status = ? WHERE id = ?', [status, id]);
};

module.exports = {
  getDashboardStats,
  assignFaculty,
  updateFeeStatus,
  upsertSemester,
  getStudentQueries,
  getUnreadQueryCount,
  updateQueryStatus
};
