const db = require('../config/db');

const buildSubjectAttendance = (marks, attendance) => {
  const attendanceMap = new Map(
    attendance.map((row) => [Number(row.semester), Number(row.attendance_percentage || 0)])
  );

  return marks.map((mark, index) => {
    const base = attendanceMap.get(Number(mark.semester)) || 0;
    const adjustment = ((index % 5) - 2) * 1.4;

    return {
      semester: Number(mark.semester),
      subject: mark.subject,
      attendance_percentage: Math.max(65, Math.min(99, +(base + adjustment).toFixed(2)))
    };
  });
};

const getStudentDashboard = async (userId) => {
  const [rows] = await db.execute(
    `SELECT s.id AS student_id, u.name, u.email, s.department, s.semester, s.father_name, s.mother_name,
            s.contact, s.cgpa_overall, s.hall_ticket_available, fu.name AS faculty_name
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN faculty f ON f.id = s.faculty_id
     LEFT JOIN users fu ON fu.id = f.user_id
     WHERE s.user_id = ?`,
    [userId]
  );

  if (!rows[0]) return null;

  const studentId = rows[0].student_id;

  const [attendance] = await db.execute(
    'SELECT semester, attendance_percentage FROM attendance WHERE student_id = ? ORDER BY semester',
    [studentId]
  );
  const [marks] = await db.execute(
    'SELECT subject, internal_marks, external_marks, semester FROM marks WHERE student_id = ? ORDER BY semester, subject',
    [studentId]
  );
  const [fees] = await db.execute(
    'SELECT semester, amount, status FROM fees WHERE student_id = ? ORDER BY semester',
    [studentId]
  );
  const [leaves] = await db.execute(
    'SELECT id, reason, from_date, to_date, status FROM leaves WHERE student_id = ? ORDER BY id DESC',
    [studentId]
  );
  const [queries] = await db.execute(
    'SELECT id, subject, message, status, created_at FROM student_queries WHERE student_id = ? ORDER BY id DESC',
    [studentId]
  );
  const [feedback] = await db.execute(
    `SELECT sf.id, sf.subject, sf.message, sf.created_at, u.name AS faculty_name
     FROM student_feedback sf
     JOIN faculty f ON f.id = sf.faculty_id
     JOIN users u ON u.id = f.user_id
     WHERE sf.student_id = ?
     ORDER BY sf.created_at DESC, sf.id DESC`,
    [studentId]
  );

  const semesterMap = new Map();
  marks.forEach((m) => {
    const total = Number(m.internal_marks) + Number(m.external_marks);
    const estimatedCgpa = +(total / 10).toFixed(2);
    if (!semesterMap.has(m.semester)) semesterMap.set(m.semester, []);
    semesterMap.get(m.semester).push(estimatedCgpa);
  });

  const semesterCgpa = Array.from(semesterMap.entries()).map(([semester, values]) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { semester, cgpa: +avg.toFixed(2) };
  });

  return {
    profile: rows[0],
    attendance,
    subjectAttendance: buildSubjectAttendance(marks, attendance),
    marks,
    fees,
    leaves,
    queries,
    feedback,
    semesterCgpa
  };
};

const getAllStudents = async () => {
  const [rows] = await db.execute(
    `SELECT s.id, s.user_id, s.faculty_id, u.name, u.email, s.department, s.semester, s.cgpa_overall,
            fu.name AS faculty_name
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN faculty f ON f.id = s.faculty_id
     LEFT JOIN users fu ON fu.id = f.user_id
     ORDER BY u.name`
  );
  return rows;
};

const createStudent = async (payload) => {
  const {
    name,
    email,
    hashedPassword,
    department,
    semester,
    faculty_id,
    father_name,
    mother_name,
    contact,
    cgpa_overall
  } = payload;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [, userResult] = await conn.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) RETURNING id',
      [name, email, hashedPassword, 'student']
    );

    await conn.execute(
      `INSERT INTO students (user_id, department, semester, faculty_id, father_name, mother_name, contact, cgpa_overall)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, department, semester, faculty_id || null, father_name, mother_name, contact, cgpa_overall]
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const updateStudent = async (id, payload) => {
  await db.execute(
    `UPDATE students
     SET department = ?, semester = ?, faculty_id = ?, father_name = ?, mother_name = ?, contact = ?, cgpa_overall = ?
     WHERE id = ?`,
    [
      payload.department,
      payload.semester,
      payload.faculty_id || null,
      payload.father_name,
      payload.mother_name,
      payload.contact,
      payload.cgpa_overall,
      id
    ]
  );
};

const deleteStudent = async (id) => {
  const [rows] = await db.execute('SELECT user_id FROM students WHERE id = ?', [id]);
  if (!rows[0]) return;
  const userId = rows[0].user_id;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM students WHERE id = ?', [id]);
    await conn.execute('DELETE FROM users WHERE id = ?', [userId]);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const submitLeave = async (studentId, reason, fromDate, toDate) => {
  await db.execute(
    'INSERT INTO leaves (student_id, reason, from_date, to_date, status) VALUES (?, ?, ?, ?, ?)',
    [studentId, reason, fromDate, toDate, 'Pending']
  );
};

const findStudentByUserId = async (userId) => {
  const [rows] = await db.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

const submitQueryToAdmin = async (studentId, subject, message) => {
  await db.execute(
    'INSERT INTO student_queries (student_id, subject, message, status) VALUES (?, ?, ?, ?)',
    [studentId, subject, message, 'Unread']
  );
};

module.exports = {
  getStudentDashboard,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  submitLeave,
  findStudentByUserId,
  submitQueryToAdmin
};
