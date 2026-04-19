const db = require('../config/db');

const getFacultyByUserId = async (userId) => {
  const [rows] = await db.execute('SELECT id, department FROM faculty WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

const getFacultyDashboard = async (facultyId) => {
  const [students] = await db.execute(
    `SELECT s.id AS student_id, u.name, u.email, s.department, s.semester, s.cgpa_overall
     FROM students s
     JOIN users u ON u.id = s.user_id
     WHERE s.faculty_id = ?
     ORDER BY u.name`,
    [facultyId]
  );

  const [pendingLeaves] = await db.execute(
    `SELECT l.id, l.student_id, l.reason, l.from_date, l.to_date, l.status, u.name AS student_name
     FROM leaves l
     JOIN students s ON s.id = l.student_id
     JOIN users u ON u.id = s.user_id
     WHERE s.faculty_id = ? AND l.status = 'Pending'
     ORDER BY l.from_date DESC, l.id DESC`,
    [facultyId]
  );

  const [allLeaveRequests] = await db.execute(
    `SELECT l.id, l.student_id, l.reason, l.from_date, l.to_date, l.status, u.name AS student_name
     FROM leaves l
     JOIN students s ON s.id = l.student_id
     JOIN users u ON u.id = s.user_id
     WHERE s.faculty_id = ?
     ORDER BY l.id DESC`,
    [facultyId]
  );

  const [leaveStudents] = await db.execute(
    `SELECT s.id AS student_id, u.name, s.department, s.semester, s.cgpa_overall,
            COUNT(l.id) AS total_leaves,
            SUM(CASE WHEN l.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
            MAX(l.from_date) AS latest_leave_date
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN leaves l ON l.student_id = s.id
     WHERE s.faculty_id = ?
     GROUP BY s.id, u.name, s.department, s.semester, s.cgpa_overall
     HAVING COUNT(l.id) > 0
     ORDER BY u.name`,
    [facultyId]
  );

  const [studentsNoLeaves] = await db.execute(
    `SELECT s.id AS student_id, u.name, s.department, s.semester, s.cgpa_overall
     FROM students s
     JOIN users u ON u.id = s.user_id
     WHERE s.faculty_id = ?
       AND NOT EXISTS (SELECT 1 FROM leaves l WHERE l.student_id = s.id)
     ORDER BY u.name`,
    [facultyId]
  );

  const [analytics] = await db.execute(
    `SELECT s.semester, AVG(s.cgpa_overall) AS avg_cgpa, AVG(a.attendance_percentage) AS avg_attendance
     FROM students s
     LEFT JOIN attendance a ON a.student_id = s.id AND a.semester = s.semester
     WHERE s.faculty_id = ?
     GROUP BY s.semester
     ORDER BY s.semester`,
    [facultyId]
  );

  const [recentFeedback] = await db.execute(
    `SELECT sf.id, sf.subject, sf.message, sf.created_at,
            s.id AS student_id, u.name AS student_name, s.semester, s.department
     FROM student_feedback sf
     JOIN students s ON s.id = sf.student_id
     JOIN users u ON u.id = s.user_id
     WHERE sf.faculty_id = ?
     ORDER BY sf.created_at DESC, sf.id DESC
     LIMIT 12`,
    [facultyId]
  );

  const [feedbackStudents] = await db.execute(
    `SELECT s.id AS student_id, u.name AS student_name, s.semester, s.department,
            COUNT(sf.id) AS feedback_count,
            MAX(sf.created_at) AS latest_feedback_at
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN student_feedback sf ON sf.student_id = s.id AND sf.faculty_id = ?
     WHERE s.faculty_id = ?
     GROUP BY s.id, u.name, s.semester, s.department
     ORDER BY latest_feedback_at DESC NULLS LAST, u.name`,
    [facultyId, facultyId]
  );

  return { students, pendingLeaves, allLeaveRequests, leaveStudents, studentsNoLeaves, analytics, recentFeedback, feedbackStudents };
};

const getFacultyMarksEntries = async (facultyId) => {
  const [rows] = await db.execute(
    `SELECT s.id AS student_id, u.name AS student_name, s.department, m.semester, m.subject, m.internal_marks, m.external_marks
     FROM marks m
     JOIN students s ON s.id = m.student_id
     JOIN users u ON u.id = s.user_id
     WHERE s.faculty_id = ?
     ORDER BY m.semester DESC, u.name, m.subject`,
    [facultyId]
  );
  return rows;
};

const getFacultyAttendanceEntries = async (facultyId) => {
  const [rows] = await db.execute(
    `SELECT s.id AS student_id, u.name AS student_name, u.email, s.department, a.semester, a.attendance_percentage
     FROM attendance a
     JOIN students s ON s.id = a.student_id
     JOIN users u ON u.id = s.user_id
     WHERE s.faculty_id = ?
     ORDER BY a.semester DESC, u.name`,
    [facultyId]
  );
  return rows;
};

const getFacultyStudentDetails = async (facultyId, studentId) => {
  const [studentRows] = await db.execute(
    `SELECT s.id AS student_id, u.name, u.email, s.department, s.semester, s.cgpa_overall,
            s.father_name, s.mother_name, s.contact
     FROM students s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.faculty_id = ?`,
    [studentId, facultyId]
  );

  if (!studentRows[0]) return null;

  const [leaves] = await db.execute(
    `SELECT id, reason, from_date, to_date, status
     FROM leaves
     WHERE student_id = ?
     ORDER BY from_date DESC, id DESC`,
    [studentId]
  );

  const [attendance] = await db.execute(
    `SELECT semester, attendance_percentage
     FROM attendance
     WHERE student_id = ?
     ORDER BY semester DESC`,
    [studentId]
  );

  const [marks] = await db.execute(
    `SELECT semester, subject, internal_marks, external_marks
     FROM marks
     WHERE student_id = ?
     ORDER BY semester DESC, subject`,
    [studentId]
  );

  const [fees] = await db.execute(
    `SELECT semester, amount, status
     FROM fees
     WHERE student_id = ?
     ORDER BY semester DESC`,
    [studentId]
  );

  const [feedback] = await db.execute(
    `SELECT sf.id, sf.subject, sf.message, sf.created_at, u.name AS faculty_name
     FROM student_feedback sf
     JOIN faculty f ON f.id = sf.faculty_id
     JOIN users u ON u.id = f.user_id
     WHERE sf.student_id = ? AND sf.faculty_id = ?
     ORDER BY sf.created_at DESC, sf.id DESC`,
    [studentId, facultyId]
  );

  return {
    student: studentRows[0],
    leaves,
    attendance,
    marks,
    fees,
    feedback
  };
};

const addFacultyFeedback = async (facultyId, studentId, subject, message) => {
  const [rows] = await db.execute(
    'SELECT id FROM students WHERE id = ? AND faculty_id = ?',
    [studentId, facultyId]
  );
  if (!rows[0]) return false;

  await db.execute(
    'INSERT INTO student_feedback (student_id, faculty_id, subject, message) VALUES (?, ?, ?, ?)',
    [studentId, facultyId, subject, message]
  );
  return true;
};

const getAllFaculty = async () => {
  const [rows] = await db.execute(
    `SELECT f.id, f.user_id, u.name, u.email, f.department, COUNT(s.id) AS assigned_students
     FROM faculty f
     JOIN users u ON u.id = f.user_id
     LEFT JOIN students s ON s.faculty_id = f.id
     GROUP BY f.id, f.user_id, u.name, u.email, f.department
     ORDER BY u.name`
  );
  return rows;
};

const createFaculty = async ({ name, email, hashedPassword, department }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [, userResult] = await conn.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) RETURNING id',
      [name, email, hashedPassword, 'faculty']
    );
    await conn.execute('INSERT INTO faculty (user_id, department) VALUES (?, ?)', [userResult.insertId, department]);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const updateFaculty = async (id, department) => {
  await db.execute('UPDATE faculty SET department = ? WHERE id = ?', [department, id]);
};

const deleteFaculty = async (id) => {
  const [rows] = await db.execute('SELECT user_id FROM faculty WHERE id = ?', [id]);
  if (!rows[0]) return;

  const userId = rows[0].user_id;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE students SET faculty_id = NULL WHERE faculty_id = ?', [id]);
    await conn.execute('DELETE FROM faculty WHERE id = ?', [id]);
    await conn.execute('DELETE FROM users WHERE id = ?', [userId]);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  getFacultyByUserId,
  getFacultyDashboard,
  getFacultyMarksEntries,
  getFacultyAttendanceEntries,
  getFacultyStudentDetails,
  addFacultyFeedback,
  getAllFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty
};
