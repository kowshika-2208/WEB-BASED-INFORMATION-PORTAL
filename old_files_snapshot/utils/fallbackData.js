const createFacultyList = () => [
  { id: 201, user_id: 2, name: 'Dr. Maya Rao', email: 'faculty@cip.edu', department: 'Computer Science' },
  { id: 202, user_id: 4, name: 'Dr. Vikram Shah', email: 'vikram.shah@cip.edu', department: 'Electronics' },
  { id: 203, user_id: 5, name: 'Dr. Nisha Verma', email: 'nisha.verma@cip.edu', department: 'Mechanical' }
];

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
const semesterCycle = [3, 4, 5, 6];
const subjectsPrev = ['Mathematics', 'Data Structures', 'Communication Skills'];
const subjectsCurrent = ['Database Systems', 'Operating Systems', 'Software Engineering'];
const leaveReasons = ['Medical leave', 'Family function', 'University event', 'Travel delay', 'Personal emergency'];

const facultyList = createFacultyList();
const facultyLookup = new Map(facultyList.map((faculty) => [faculty.name, faculty]));

const students = Array.from({ length: 50 }, (_, index) => {
  const firstName = firstNames[index];
  const lastName = lastNames[index];
  return {
    student_id: 101 + index,
    name: `${firstName} ${lastName}`,
    email: index === 0 ? 'student@cip.edu' : `${firstName}.${lastName}${index + 1}@cip.edu`.toLowerCase(),
    department: 'Computer Science',
    semester: semesterCycle[index % semesterCycle.length],
    father_name: `${lastName} Kumar`,
    mother_name: `${lastName} Devi`,
    contact: `+91 90000 ${String(index + 1).padStart(5, '0')}`,
    cgpa_overall: +(7.1 + ((index * 0.17) % 2.6)).toFixed(2),
    hall_ticket_available: index % 4 === 0 ? 0 : 1,
    faculty_name: 'Dr. Maya Rao'
  };
});

const allMarks = students.flatMap((student, index) => {
  const semPrev = student.semester > 1 ? student.semester - 1 : student.semester;
  return [
    { student_id: student.student_id, semester: semPrev, subject: subjectsPrev[0], internal_marks: 25 + (index % 11), external_marks: 38 + (index % 22) },
    { student_id: student.student_id, semester: semPrev, subject: subjectsPrev[1], internal_marks: 26 + (index % 10), external_marks: 39 + (index % 20) },
    { student_id: student.student_id, semester: semPrev, subject: subjectsPrev[2], internal_marks: 27 + (index % 9), external_marks: 40 + (index % 18) },
    { student_id: student.student_id, semester: student.semester, subject: subjectsCurrent[0], internal_marks: 28 + (index % 10), external_marks: 41 + (index % 17) },
    { student_id: student.student_id, semester: student.semester, subject: subjectsCurrent[1], internal_marks: 29 + (index % 8), external_marks: 42 + (index % 16) },
    { student_id: student.student_id, semester: student.semester, subject: subjectsCurrent[2], internal_marks: 30 + (index % 7), external_marks: 43 + (index % 15) }
  ];
});

const allAttendance = students.flatMap((student, index) => {
  const semPrev = student.semester > 1 ? student.semester - 1 : student.semester;
  return [
    { student_id: student.student_id, semester: semPrev, attendance_percentage: Math.min(98, 76 + (index % 18)) },
    { student_id: student.student_id, semester: student.semester, attendance_percentage: Math.min(99, 81 + (index % 17)) }
  ];
});

const allFees = students.flatMap((student, index) => {
  const semPrev = student.semester > 1 ? student.semester - 1 : student.semester;
  return [
    { student_id: student.student_id, semester: semPrev, amount: 2400 + (index * 35), status: 'Paid' },
    { student_id: student.student_id, semester: student.semester, amount: 2600 + (index * 35), status: index % 5 === 0 ? 'Pending' : 'Paid' }
  ];
});

const allLeaves = students.flatMap((student, index) => [
  {
    id: index * 2 + 1,
    student_id: student.student_id,
    reason: leaveReasons[index % leaveReasons.length],
    from_date: '2026-01-10',
    to_date: '2026-01-11',
    status: index % 4 === 0 ? 'Rejected' : 'Approved'
  },
  {
    id: index * 2 + 2,
    student_id: student.student_id,
    reason: leaveReasons[(index + 1) % leaveReasons.length],
    from_date: '2026-02-04',
    to_date: '2026-02-05',
    status: index % 3 === 0 ? 'Pending' : 'Approved'
  }
]);

const allQueries = students.map((student, index) => ({
  id: index + 1,
  student_id: student.student_id,
  subject: `Query ${index + 1}`,
  message: `${student.name} needs clarification about academic progress and mentor feedback.`,
  status: index % 4 === 0 ? 'Unread' : 'Read',
  created_at: `2026-02-${String((index % 28) + 1).padStart(2, '0')}T09:30:00.000Z`
}));

const allFeedback = students.slice(0, 4).map((student, index) => ({
  id: index + 1,
  student_id: student.student_id,
  faculty_id: 201,
  subject: index % 2 === 0 ? 'Academic Progress' : 'Attendance Improvement',
  message:
    index % 2 === 0
      ? `Dear ${student.name}, your progress is being monitored closely. Stay consistent and keep improving your semester performance.`
      : `Dear ${student.name}, please maintain regular attendance and follow the faculty guidance for this semester.`,
  faculty_name: 'Dr. Maya Rao',
  created_at: `2026-03-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`
}));

const demoUsers = [
  { id: 1, name: 'System Admin', email: 'admin@cip.edu', password: 'Admin@123', role: 'admin' },
  { id: 2, name: 'Dr. Maya Rao', email: 'faculty@cip.edu', password: 'Faculty@123', role: 'faculty' },
  { id: 3, name: students[0].name, email: 'student@cip.edu', password: 'Student@123', role: 'student' }
];

const isDbUnavailable = (error) => {
  const dbCodes = new Set([
    'ECONNREFUSED',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
    'PROTOCOL_CONNECTION_LOST',
    '3D000',
    '28P01',
    'ECONNRESET'
  ]);
  return Boolean(error && (dbCodes.has(error.code) || /postgres|database/i.test(String(error.message || ''))));
};

const findFallbackUserByCredentials = (email, password) =>
  demoUsers.find(
    (user) => String(user.email).toLowerCase() === String(email).toLowerCase() && user.password === password
  ) || null;

const getFallbackStudentDashboard = (email) => {
  const profile = students.find((student) => student.email.toLowerCase() === String(email || '').toLowerCase()) || students[0];
  const studentMarks = allMarks.filter((mark) => mark.student_id === profile.student_id);
  const attendance = allAttendance.filter((row) => row.student_id === profile.student_id);
  const fees = allFees.filter((fee) => fee.student_id === profile.student_id);
  const leaves = allLeaves.filter((leave) => leave.student_id === profile.student_id);
  const queries = allQueries.filter((query) => query.student_id === profile.student_id);
  const feedback = allFeedback.filter((item) => item.student_id === profile.student_id);

  const semesterMap = new Map();
  studentMarks.forEach((mark) => {
    const total = Number(mark.internal_marks) + Number(mark.external_marks);
    const estimatedCgpa = +(total / 10).toFixed(2);
    if (!semesterMap.has(mark.semester)) semesterMap.set(mark.semester, []);
    semesterMap.get(mark.semester).push(estimatedCgpa);
  });

  const semesterCgpa = Array.from(semesterMap.entries()).map(([semester, values]) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { semester, cgpa: +avg.toFixed(2) };
  });

  return { profile, attendance, marks: studentMarks, fees, leaves, queries, feedback, semesterCgpa };
};

const getFallbackFacultyData = () => {
  const facultyStudents = students.map((student) => ({
    student_id: student.student_id,
    name: student.name,
    email: student.email,
    department: student.department,
    semester: student.semester,
    cgpa_overall: student.cgpa_overall
  }));

  const pendingLeaves = allLeaves
    .filter((leave) => leave.status === 'Pending')
    .map((leave) => {
      const student = students.find((item) => item.student_id === leave.student_id);
      return { ...leave, student_name: student ? student.name : 'Unknown' };
    });

  const allLeaveRequests = allLeaves
    .map((leave) => {
      const student = students.find((item) => item.student_id === leave.student_id);
      return { ...leave, student_name: student ? student.name : 'Unknown' };
    })
    .sort((a, b) => Number(b.id) - Number(a.id));

  const leaveStudents = facultyStudents
    .filter((student) => allLeaves.some((leave) => leave.student_id === student.student_id))
    .map((student) => {
      const leaves = allLeaves.filter((leave) => leave.student_id === student.student_id);
      return {
        ...student,
        total_leaves: leaves.length,
        pending_count: leaves.filter((leave) => leave.status === 'Pending').length,
        latest_leave_date: leaves[0] ? leaves[0].from_date : null
      };
    });

  const studentsNoLeaves = facultyStudents.filter(
    (student) => !allLeaves.some((leave) => leave.student_id === student.student_id)
  );

  const analyticsMap = new Map();
  facultyStudents.forEach((student) => {
    if (!analyticsMap.has(student.semester)) analyticsMap.set(student.semester, { cgpa: [], attendance: [] });
    analyticsMap.get(student.semester).cgpa.push(Number(student.cgpa_overall || 0));
    const attendanceRow = allAttendance.find(
      (row) => row.student_id === student.student_id && row.semester === student.semester
    );
    analyticsMap.get(student.semester).attendance.push(Number(attendanceRow ? attendanceRow.attendance_percentage : 0));
  });

  const analytics = Array.from(analyticsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([semester, values]) => ({
      semester,
      avg_cgpa: +(values.cgpa.reduce((a, b) => a + b, 0) / values.cgpa.length).toFixed(2),
      avg_attendance: +(values.attendance.reduce((a, b) => a + b, 0) / values.attendance.length).toFixed(2)
    }));

  return { students: facultyStudents, pendingLeaves, allLeaveRequests, leaveStudents, studentsNoLeaves, analytics };
};

const getFallbackFacultyMarksEntries = () =>
  allMarks
    .map((mark) => {
      const student = students.find((item) => Number(item.student_id) === Number(mark.student_id));
      if (!student) return null;
      return {
        student_id: student.student_id,
        student_name: student.name,
        department: student.department,
        semester: mark.semester,
        subject: mark.subject,
        internal_marks: Number(mark.internal_marks || 0),
        external_marks: Number(mark.external_marks || 0)
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.semester) - Number(b.semester) || String(a.student_name).localeCompare(String(b.student_name)));

const upsertFallbackMark = (studentId, subject, internalMarks, externalMarks, semester) => {
  const id = Number(studentId);
  const sem = Number(semester);
  const internal = Number(internalMarks || 0);
  const external =
    externalMarks === undefined || externalMarks === null || externalMarks === ''
      ? null
      : Number(externalMarks);

  const existing = allMarks.find(
    (mark) =>
      Number(mark.student_id) === id &&
      Number(mark.semester) === sem &&
      String(mark.subject).toLowerCase() === String(subject).toLowerCase()
  );

  if (existing) {
    existing.internal_marks = internal;
    if (external !== null) existing.external_marks = external;
    return true;
  }

  allMarks.push({
    student_id: id,
    semester: sem,
    subject,
    internal_marks: internal,
    external_marks: external !== null ? external : 0
  });
  return true;
};

const getFallbackFacultyAttendanceEntries = () =>
  allAttendance
    .map((row) => {
      const student = students.find((item) => Number(item.student_id) === Number(row.student_id));
      if (!student) return null;
      return {
        student_id: student.student_id,
        student_name: student.name,
        email: student.email,
        department: student.department,
        semester: row.semester,
        attendance_percentage: Number(row.attendance_percentage || 0)
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.semester) - Number(a.semester) || String(a.student_name).localeCompare(String(b.student_name)));

const upsertFallbackAttendance = (studentId, semester, attendancePercentage) => {
  const id = Number(studentId);
  const sem = Number(semester);
  const percentage = Number(attendancePercentage || 0);

  const existing = allAttendance.find((row) => Number(row.student_id) === id && Number(row.semester) === sem);
  if (existing) {
    existing.attendance_percentage = percentage;
    return true;
  }

  allAttendance.push({
    student_id: id,
    semester: sem,
    attendance_percentage: percentage
  });
  return true;
};

const getFallbackFacultyStudentDetails = (studentId) => {
  const id = Number(studentId);
  const student = students.find((item) => item.student_id === id);
  if (!student) return null;
  return {
    student,
    leaves: allLeaves.filter((leave) => leave.student_id === id),
    attendance: allAttendance.filter((row) => row.student_id === id),
    marks: allMarks.filter((mark) => mark.student_id === id),
    fees: allFees.filter((fee) => fee.student_id === id),
    feedback: allFeedback.filter((item) => item.student_id === id)
  };
};

const getFallbackAdminData = () => {
  const studentCount = students.length;
  const deptSet = new Set(students.map((student) => student.department));
  const passCount = students.filter((student) => Number(student.cgpa_overall) >= 5).length;

  const departmentBreakdown = Array.from(deptSet).map((department) => ({
    department,
    total: students.filter((student) => student.department === department).length
  }));

  const semSet = new Set(students.map((student) => student.semester));
  const performance = Array.from(semSet)
    .sort((a, b) => a - b)
    .map((semester) => {
      const rows = students.filter((student) => student.semester === semester);
      const avg = rows.reduce((sum, student) => sum + Number(student.cgpa_overall || 0), 0) / rows.length;
      return { semester, avg_cgpa: +avg.toFixed(2) };
    });

  const queries = allQueries.map((query) => {
    const student = students.find((item) => item.student_id === query.student_id);
    return {
      ...query,
      student_name: student ? student.name : 'Unknown',
      student_email: student ? student.email : '',
      department: student ? student.department : '',
      semester: student ? student.semester : ''
    };
  });

  return {
    stats: {
      studentCount,
      deptCount: deptSet.size,
      passPercentage: studentCount ? +((passCount * 100) / studentCount).toFixed(2) : 0,
      departmentBreakdown,
      performance
    },
    students: students.map((student) => ({
      id: student.student_id,
      user_id: student.student_id + 1000,
      faculty_id: facultyLookup.get(student.faculty_name)?.id || null,
      name: student.name,
      email: student.email,
      department: student.department,
      semester: student.semester,
      cgpa_overall: student.cgpa_overall,
      faculty_name: student.faculty_name
    })),
    faculty: facultyList.map((faculty) => ({
      ...faculty,
      assigned_students: students.filter((student) => student.faculty_name === faculty.name).length
    })),
    queries,
    unreadQueryCount: queries.filter((query) => query.status === 'Unread').length
  };
};

const updateFallbackQueryStatus = (id, status) => {
  const query = allQueries.find((item) => Number(item.id) === Number(id));
  if (!query) return false;
  query.status = status;
  return true;
};

const submitFallbackLeave = (email, reason, fromDate, toDate) => {
  const profile = students.find((student) => student.email.toLowerCase() === String(email || '').toLowerCase());
  if (!profile) return false;

  const nextId = allLeaves.length ? Math.max(...allLeaves.map((leave) => Number(leave.id))) + 1 : 1;
  allLeaves.unshift({
    id: nextId,
    student_id: profile.student_id,
    reason,
    from_date: fromDate,
    to_date: toDate,
    status: 'Pending'
  });
  return true;
};

const updateFallbackLeaveStatus = (leaveId, status) => {
  const leave = allLeaves.find((item) => Number(item.id) === Number(leaveId));
  if (!leave) return false;
  leave.status = status;
  return true;
};

const submitFallbackFacultyFeedback = (studentId, subject, message) => {
  const id = Number(studentId);
  const student = students.find((item) => Number(item.student_id) === id);
  if (!student) return false;

  const nextId = allFeedback.length ? Math.max(...allFeedback.map((item) => Number(item.id))) + 1 : 1;
  allFeedback.unshift({
    id: nextId,
    student_id: id,
    faculty_id: 201,
    subject,
    message,
    faculty_name: 'Dr. Maya Rao',
    created_at: new Date().toISOString()
  });
  return true;
};

module.exports = {
  isDbUnavailable,
  findFallbackUserByCredentials,
  getFallbackStudentDashboard,
  getFallbackFacultyData,
  getFallbackFacultyMarksEntries,
  getFallbackFacultyAttendanceEntries,
  getFallbackFacultyStudentDetails,
  getFallbackAdminData,
  updateFallbackQueryStatus,
  submitFallbackLeave,
  submitFallbackFacultyFeedback,
  upsertFallbackMark,
  upsertFallbackAttendance,
  updateFallbackLeaveStatus
};
