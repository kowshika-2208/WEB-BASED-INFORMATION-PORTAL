const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const facultyPass = await bcrypt.hash('Faculty@123', 10);
    const studentPass = await bcrypt.hash('Student@123', 10);

    await conn.beginTransaction();

    await conn.execute('DELETE FROM marks');
    await conn.execute('DELETE FROM attendance');
    await conn.execute('DELETE FROM leaves');
    await conn.execute('DELETE FROM student_queries');
    await conn.execute('DELETE FROM fees');
    await conn.execute('DELETE FROM students');
    await conn.execute('DELETE FROM faculty');
    await conn.execute('DELETE FROM semesters');
    await conn.execute('DELETE FROM users');

    await conn.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['System Admin', 'admin@cip.edu', adminPass, 'admin']
    );

    const facultySeed = [
      { name: 'Dr. Maya Rao', email: 'faculty@cip.edu', dept: 'Computer Science' },
      { name: 'Dr. Vikram Shah', email: 'vikram.shah@cip.edu', dept: 'Electronics' },
      { name: 'Dr. Nisha Verma', email: 'nisha.verma@cip.edu', dept: 'Mechanical' }
    ];

    const facultyIds = [];
    for (const fac of facultySeed) {
      const [fUser] = await conn.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [fac.name, fac.email, facultyPass, 'faculty']
      );
      const [facRow] = await conn.execute(
        'INSERT INTO faculty (user_id, department) VALUES (?, ?)',
        [fUser.insertId, fac.dept]
      );
      facultyIds.push({ id: facRow.insertId, dept: fac.dept });
    }

    await conn.execute(
      'INSERT INTO semesters (semester_number, academic_year) VALUES (?, ?), (?, ?), (?, ?), (?, ?)',
      [3, '2025-2026', 4, '2025-2026', 5, '2025-2026', 6, '2025-2026']
    );

    const students = [
      { name: 'Arjun Patel', email: 'student@cip.edu', dept: 'Computer Science', sem: 5, father: 'Ramesh Patel', mother: 'Anita Patel', contact: '+1-555-0100', cgpa: 8.42, hall: 1 },
      { name: 'Priya Menon', email: 'priya.menon@cip.edu', dept: 'Computer Science', sem: 5, father: 'Suresh Menon', mother: 'Latha Menon', contact: '+1-555-0101', cgpa: 8.88, hall: 1 },
      { name: 'Rahul Singh', email: 'rahul.singh@cip.edu', dept: 'Computer Science', sem: 4, father: 'Mohan Singh', mother: 'Neeta Singh', contact: '+1-555-0102', cgpa: 7.95, hall: 1 },
      { name: 'Neha Iyer', email: 'neha.iyer@cip.edu', dept: 'Electronics', sem: 6, father: 'Karthik Iyer', mother: 'Meera Iyer', contact: '+1-555-0103', cgpa: 8.11, hall: 1 },
      { name: 'Karan Gupta', email: 'karan.gupta@cip.edu', dept: 'Electronics', sem: 5, father: 'Rajesh Gupta', mother: 'Pooja Gupta', contact: '+1-555-0104', cgpa: 7.52, hall: 0 },
      { name: 'Aditi Rao', email: 'aditi.rao@cip.edu', dept: 'Electronics', sem: 4, father: 'Sanjay Rao', mother: 'Shalini Rao', contact: '+1-555-0105', cgpa: 8.32, hall: 1 },
      { name: 'Sanjay Kulkarni', email: 'sanjay.kulkarni@cip.edu', dept: 'Mechanical', sem: 6, father: 'Ravi Kulkarni', mother: 'Kavita Kulkarni', contact: '+1-555-0106', cgpa: 7.73, hall: 1 },
      { name: 'Meera Das', email: 'meera.das@cip.edu', dept: 'Mechanical', sem: 5, father: 'Pradeep Das', mother: 'Sunita Das', contact: '+1-555-0107', cgpa: 8.19, hall: 0 },
      { name: 'Dev Sharma', email: 'dev.sharma@cip.edu', dept: 'Mechanical', sem: 3, father: 'Alok Sharma', mother: 'Ritu Sharma', contact: '+1-555-0108', cgpa: 7.26, hall: 0 },
      { name: 'Ananya Joseph', email: 'ananya.joseph@cip.edu', dept: 'Computer Science', sem: 3, father: 'Thomas Joseph', mother: 'Reena Joseph', contact: '+1-555-0109', cgpa: 9.02, hall: 1 }
    ];

    for (let i = 0; i < students.length; i += 1) {
      const s = students[i];
      const assignedFaculty = facultyIds.find((f) => f.dept === s.dept) || facultyIds[0];

      const [sUser] = await conn.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [s.name, s.email, studentPass, 'student']
      );

      const [stu] = await conn.execute(
        `INSERT INTO students (user_id, department, semester, faculty_id, father_name, mother_name, contact, cgpa_overall, hall_ticket_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sUser.insertId, s.dept, s.sem, assignedFaculty.id, s.father, s.mother, s.contact, s.cgpa, s.hall]
      );

      const semCurrent = s.sem;
      const semPrev = semCurrent > 1 ? semCurrent - 1 : semCurrent;

      await conn.execute(
        'INSERT INTO attendance (student_id, semester, attendance_percentage) VALUES (?, ?, ?), (?, ?, ?)',
        [
          stu.insertId, semPrev, Math.min(98, 78 + i),
          stu.insertId, semCurrent, Math.min(98, 82 + i)
        ]
      );

      await conn.execute(
        'INSERT INTO marks (student_id, subject, internal_marks, external_marks, semester) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        [
          stu.insertId, 'Mathematics', 28 + (i % 10), 40 + (i % 20), semPrev,
          stu.insertId, 'Data Structures', 27 + (i % 10), 41 + (i % 18), semPrev,
          stu.insertId, 'Communication Skills', 30 + (i % 10), 43 + (i % 15), semPrev,
          stu.insertId, 'Database Systems', 29 + (i % 10), 44 + (i % 15), semCurrent,
          stu.insertId, 'Operating Systems', 28 + (i % 10), 42 + (i % 18), semCurrent,
          stu.insertId, 'Software Engineering', 31 + (i % 9), 45 + (i % 14), semCurrent
        ]
      );

      await conn.execute(
        'INSERT INTO fees (student_id, semester, amount, status) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
        [
          stu.insertId, semPrev, 2600 + (i * 100), 'Paid',
          stu.insertId, semCurrent, 2800 + (i * 100), i % 3 === 0 ? 'Pending' : 'Paid'
        ]
      );

      await conn.execute(
        'INSERT INTO leaves (student_id, reason, from_date, to_date, status) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        [
          stu.insertId, 'Medical leave', '2026-01-10', '2026-01-11', i % 4 === 0 ? 'Rejected' : 'Approved',
          stu.insertId, 'Family function', '2026-02-04', '2026-02-05', i % 2 === 0 ? 'Pending' : 'Approved'
        ]
      );
    }

    await conn.commit();

    console.log('Seed completed with 10 students. Login credentials:');
    console.log('Admin: admin@cip.edu / Admin@123');
    console.log('Faculty: faculty@cip.edu / Faculty@123');
    console.log('Students: any student email in seed list / Student@123');
  } catch (error) {
    await conn.rollback();
    console.error(error);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

seed();
