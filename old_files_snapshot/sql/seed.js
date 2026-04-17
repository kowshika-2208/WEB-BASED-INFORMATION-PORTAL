const bcrypt = require('bcrypt');
const db = require('../config/db');
require('dotenv').config();

const departments = ['Computer Science', 'Electronics', 'Mechanical'];
const semesterCycle = [3, 4, 5, 6];
const firstNames = [
  'Arjun', 'Priya', 'Rahul', 'Neha', 'Karan', 'Aditi', 'Sanjay', 'Meera', 'Dev', 'Ananya',
  'Rohan', 'Ishita', 'Varun', 'Kavya', 'Nikhil', 'Pooja', 'Aman', 'Sneha', 'Harish', 'Diya',
  'Siddharth', 'Nandini', 'Yash', 'Bhavna', 'Adarsh', 'Tanvi', 'Manav', 'Ritika', 'Sohan', 'Mitali',
  'Abhishek', 'Keerthi', 'Pranav', 'Lavanya', 'Akash', 'Nisha', 'Gaurav', 'Shreya', 'Vivek', 'Tara',
  'Ritesh', 'Anika', 'Suraj', 'Pallavi', 'Darshan', 'Manya', 'Tejas', 'Simran', 'Kishore', 'Aarohi'
];
const lastNames = [
  'Patel', 'Menon', 'Singh', 'Iyer', 'Gupta', 'Rao', 'Kulkarni', 'Das', 'Sharma', 'Joseph',
  'Malhotra', 'Reddy', 'Bose', 'Chopra', 'Nair', 'Saxena', 'Verma', 'Mishra', 'Kapoor', 'Jain',
  'Agarwal', 'Bhat', 'Pandey', 'Chauhan', 'Dutta', 'Roy', 'Sethi', 'Naidu', 'Kohli', 'Pillai',
  'Kumar', 'Desai', 'Yadav', 'Thakur', 'Dubey', 'Shetty', 'Tripathi', 'Bansal', 'Bhatt', 'Arora',
  'Ghosh', 'Tiwari', 'Shukla', 'Kadam', 'Rawat', 'Bajaj', 'Bedi', 'Soni', 'Purohit', 'Mehta'
];
const leaveReasons = [
  'Medical leave',
  'Family function',
  'University event participation',
  'Travel delay',
  'Personal emergency'
];
const previousSubjects = ['Mathematics', 'Data Structures', 'Communication Skills'];
const currentSubjects = ['Database Systems', 'Operating Systems', 'Software Engineering'];

const titleCase = (value) =>
  String(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildStudentSeed = () =>
  Array.from({ length: 50 }, (_, index) => {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[index % lastNames.length];
    const fullName = `${firstName} ${lastName}`;
    const email =
      index === 0
        ? 'student@cip.edu'
        : `${firstName}.${lastName}${index + 1}@cip.edu`.toLowerCase();
    const sem = semesterCycle[index % semesterCycle.length];
    const dept = index < 50 ? 'Computer Science' : departments[index % departments.length];

    return {
      name: fullName,
      email,
      dept,
      sem,
      father: `${titleCase(lastName)} Kumar`,
      mother: `${titleCase(lastName)} Devi`,
      contact: `+1-555-${String(1000 + index).padStart(4, '0')}`,
      cgpa: +(7.1 + ((index * 0.17) % 2.6)).toFixed(2),
      hall: index % 4 !== 0
    };
  });

async function seed() {
  const conn = await db.getConnection();

  try {
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const facultyPass = await bcrypt.hash('Faculty@123', 10);
    const studentPass = await bcrypt.hash('Student@123', 10);

    await conn.beginTransaction();

    await conn.execute('DELETE FROM marks');
    await conn.execute('DELETE FROM attendance');
    await conn.execute('DELETE FROM leaves');
    await conn.execute('DELETE FROM student_feedback');
    await conn.execute('DELETE FROM student_queries');
    await conn.execute('DELETE FROM fees');
    await conn.execute('DELETE FROM students');
    await conn.execute('DELETE FROM faculty');
    await conn.execute('DELETE FROM semesters');
    await conn.execute('DELETE FROM users');

    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('faculty', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('students', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('marks', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('attendance', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('leaves', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('fees', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('semesters', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('student_queries', 'id'), 1, false)"
    );
    await conn.execute(
      "SELECT setval(pg_get_serial_sequence('student_feedback', 'id'), 1, false)"
    );

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
      const [, fUser] = await conn.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) RETURNING id',
        [fac.name, fac.email, facultyPass, 'faculty']
      );
      const [, facRow] = await conn.execute(
        'INSERT INTO faculty (user_id, department) VALUES (?, ?) RETURNING id',
        [fUser.insertId, fac.dept]
      );
      facultyIds.push({ id: facRow.insertId, dept: fac.dept });
    }

    await conn.execute(
      'INSERT INTO semesters (semester_number, academic_year) VALUES (?, ?), (?, ?), (?, ?), (?, ?)',
      [3, '2025-2026', 4, '2025-2026', 5, '2025-2026', 6, '2025-2026']
    );

    const students = buildStudentSeed();
    const primaryFaculty = facultyIds[0];

    for (let i = 0; i < students.length; i += 1) {
      const s = students[i];
      const assignedFaculty = primaryFaculty;

      const [, sUser] = await conn.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) RETURNING id',
        [s.name, s.email, studentPass, 'student']
      );

      const [, stu] = await conn.execute(
        `INSERT INTO students (user_id, department, semester, faculty_id, father_name, mother_name, contact, cgpa_overall, hall_ticket_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        [sUser.insertId, s.dept, s.sem, assignedFaculty.id, s.father, s.mother, s.contact, s.cgpa, s.hall]
      );

      const studentId = stu.insertId;
      const semCurrent = s.sem;
      const semPrev = semCurrent > 1 ? semCurrent - 1 : semCurrent;

      await conn.execute(
        'INSERT INTO attendance (student_id, semester, attendance_percentage) VALUES (?, ?, ?), (?, ?, ?)',
        [
          studentId, semPrev, Math.min(98, 76 + (i % 18)),
          studentId, semCurrent, Math.min(99, 81 + (i % 17))
        ]
      );

      const marksPayload = [
        studentId, previousSubjects[0], 25 + (i % 11), 38 + (i % 22), semPrev,
        studentId, previousSubjects[1], 26 + (i % 10), 39 + (i % 20), semPrev,
        studentId, previousSubjects[2], 27 + (i % 9), 40 + (i % 18), semPrev,
        studentId, currentSubjects[0], 28 + (i % 10), 41 + (i % 17), semCurrent,
        studentId, currentSubjects[1], 29 + (i % 8), 42 + (i % 16), semCurrent,
        studentId, currentSubjects[2], 30 + (i % 7), 43 + (i % 15), semCurrent
      ];

      await conn.execute(
        'INSERT INTO marks (student_id, subject, internal_marks, external_marks, semester) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        marksPayload
      );

      await conn.execute(
        'INSERT INTO fees (student_id, semester, amount, status) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
        [
          studentId, semPrev, 2400 + (i * 35), 'Paid',
          studentId, semCurrent, 2600 + (i * 35), i % 5 === 0 ? 'Pending' : 'Paid'
        ]
      );

      await conn.execute(
        'INSERT INTO leaves (student_id, reason, from_date, to_date, status) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        [
          studentId, leaveReasons[i % leaveReasons.length], '2026-01-10', '2026-01-11', i % 4 === 0 ? 'Rejected' : 'Approved',
          studentId, leaveReasons[(i + 1) % leaveReasons.length], '2026-02-04', '2026-02-05', i % 3 === 0 ? 'Pending' : 'Approved'
        ]
      );

      await conn.execute(
        'INSERT INTO student_queries (student_id, subject, message, status) VALUES (?, ?, ?, ?)',
        [
          studentId,
          `Query ${i + 1}`,
          `Student ${s.name} needs clarification about academic progress and monitoring updates.`,
          i % 4 === 0 ? 'Unread' : 'Read'
        ]
      );

      if (i < 2) {
        await conn.execute(
          'INSERT INTO student_feedback (student_id, faculty_id, subject, message) VALUES (?, ?, ?, ?)',
          [
            studentId,
            assignedFaculty.id,
            i === 0 ? 'Academic Progress' : 'Attendance Improvement',
            i === 0
              ? `Dear ${s.name}, keep up your semester progress and stay consistent with internal preparation.`
              : `Dear ${s.name}, please improve attendance and stay regular in your monitored classes.`
          ]
        );
      }
    }

    await conn.commit();

    console.log('Seed completed with 50 students assigned to Dr. Maya Rao.');
    console.log('Admin: admin@cip.edu / Admin@123');
    console.log('Faculty: faculty@cip.edu / Faculty@123');
    console.log('Students: student@cip.edu or any generated student email / Student@123');
  } catch (error) {
    await conn.rollback();
    console.error(error);
    process.exitCode = 1;
  } finally {
    conn.release();
    await db.end();
  }
}

seed();
