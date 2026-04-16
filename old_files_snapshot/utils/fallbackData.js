const demoUsers = [
  { id: 1, name: 'System Admin', email: 'admin@cip.edu', password: 'Admin@123', role: 'admin' },
  { id: 2, name: 'Dr. Maya Rao', email: 'faculty@cip.edu', password: 'Faculty@123', role: 'faculty' },
  { id: 3, name: 'Arjun Patel', email: 'student@cip.edu', password: 'Student@123', role: 'student' }
];

const students = [
  {
    student_id: 101,
    name: 'Arjun Patel',
    email: 'student@cip.edu',
    department: 'Computer Science',
    semester: 5,
    father_name: 'Ramesh Patel',
    mother_name: 'Anita Patel',
    contact: '+91 98765 43210',
    cgpa_overall: 8.42,
    hall_ticket_available: 1,
    faculty_name: 'Dr. Maya Rao'
  },
  {
    student_id: 102,
    name: 'Priya Menon',
    email: 'priya.menon@cip.edu',
    department: 'Computer Science',
    semester: 5,
    father_name: 'Suresh Menon',
    mother_name: 'Latha Menon',
    contact: '+91 90000 00001',
    cgpa_overall: 8.88,
    hall_ticket_available: 1,
    faculty_name: 'Dr. Maya Rao'
  },
  {
    student_id: 103,
    name: 'Rahul Singh',
    email: 'rahul.singh@cip.edu',
    department: 'Computer Science',
    semester: 4,
    father_name: 'Mohan Singh',
    mother_name: 'Neeta Singh',
    contact: '+91 90000 00002',
    cgpa_overall: 7.95,
    hall_ticket_available: 1,
    faculty_name: 'Dr. Maya Rao'
  }
];

const allMarks = [
  { student_id: 101, semester: 5, subject: 'Mathematics', internal_marks: 42, external_marks: 78 },
  { student_id: 101, semester: 5, subject: 'Data Structures', internal_marks: 38, external_marks: 72 },
  { student_id: 101, semester: 5, subject: 'Digital Electronics', internal_marks: 35, external_marks: 65 },
  { student_id: 101, semester: 5, subject: 'English', internal_marks: 40, external_marks: 80 },
  { student_id: 101, semester: 5, subject: 'Physics', internal_marks: 30, external_marks: 60 },
  { student_id: 102, semester: 5, subject: 'Mathematics', internal_marks: 40, external_marks: 76 },
  { student_id: 102, semester: 5, subject: 'Data Structures', internal_marks: 37, external_marks: 74 },
  { student_id: 103, semester: 4, subject: 'Mathematics', internal_marks: 34, external_marks: 66 },
  { student_id: 103, semester: 4, subject: 'Operating Systems', internal_marks: 32, external_marks: 60 }
];

const allAttendance = [
  { student_id: 101, semester: 4, attendance_percentage: 88 },
  { student_id: 101, semester: 5, attendance_percentage: 92 },
  { student_id: 102, semester: 5, attendance_percentage: 90 },
  { student_id: 103, semester: 4, attendance_percentage: 84 }
];

const allFees = [
  { student_id: 101, semester: 4, amount: 2600, status: 'Paid' },
  { student_id: 101, semester: 5, amount: 2800, status: 'Paid' },
  { student_id: 102, semester: 5, amount: 2800, status: 'Pending' },
  { student_id: 103, semester: 4, amount: 2500, status: 'Paid' }
];

const allLeaves = [
  { id: 1, student_id: 101, reason: 'Medical leave', from_date: '2026-01-10', to_date: '2026-01-11', status: 'Approved' },
  { id: 2, student_id: 101, reason: 'Family function', from_date: '2026-02-04', to_date: '2026-02-05', status: 'Pending' },
  { id: 3, student_id: 102, reason: 'Competition', from_date: '2026-02-15', to_date: '2026-02-16', status: 'Approved' }
];

const allQueries = [
  { id: 1, student_id: 101, subject: 'Scholarship status', message: 'Please confirm scholarship release date.', status: 'Unread', created_at: '2026-02-14T09:30:00.000Z' },
  { id: 2, student_id: 102, subject: 'Fee due date', message: 'Need extension for current semester fee.', status: 'Read', created_at: '2026-02-19T10:15:00.000Z' }
];

const isDbUnavailable = (error) => {
  const dbCodes = new Set([
    'ECONNREFUSED',
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR',
    'PROTOCOL_CONNECTION_LOST'
  ]);
  return Boolean(error && (dbCodes.has(error.code) || /mysql|database/i.test(String(error.message || ''))));
};

const findFallbackUserByCredentials = (email, password) =>
  demoUsers.find(
    (u) => String(u.email).toLowerCase() === String(email).toLowerCase() && u.password === password
  ) || null;

const getFallbackStudentDashboard = (email) => {
  const profile = students.find((s) => s.email.toLowerCase() === String(email || '').toLowerCase()) || students[0];
  const studentMarks = allMarks.filter((m) => m.student_id === profile.student_id);
  const attendance = allAttendance.filter((a) => a.student_id === profile.student_id);
  const fees = allFees.filter((f) => f.student_id === profile.student_id);
  const leaves = allLeaves.filter((l) => l.student_id === profile.student_id);
  const queries = allQueries.filter((q) => q.student_id === profile.student_id);

  const semesterMap = new Map();
  studentMarks.forEach((m) => {
    const total = Number(m.internal_marks) + Number(m.external_marks);
    const estimatedCgpa = +(total / 10).toFixed(2);
    if (!semesterMap.has(m.semester)) semesterMap.set(m.semester, []);
    semesterMap.get(m.semester).push(estimatedCgpa);
  });

  const semesterCgpa = Array.from(semesterMap.entries()).map(([semester, values]) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { semester, cgpa: +avg.toFixed(2) };
  });

  return { profile, attendance, marks: studentMarks, fees, leaves, queries, semesterCgpa };
};

const getFallbackFacultyData = () => {
  const facultyStudents = students.map((s) => ({
    student_id: s.student_id,
    name: s.name,
    email: s.email,
    department: s.department,
    semester: s.semester,
    cgpa_overall: s.cgpa_overall
  }));

  const pendingLeaves = allLeaves
    .filter((l) => l.status === 'Pending')
    .map((l) => {
      const student = students.find((s) => s.student_id === l.student_id);
      return { ...l, student_name: student ? student.name : 'Unknown' };
    });

  const allLeaveRequests = allLeaves
    .map((l) => {
      const student = students.find((s) => s.student_id === l.student_id);
      return { ...l, student_name: student ? student.name : 'Unknown' };
    })
    .sort((a, b) => Number(b.id) - Number(a.id));

  const leaveStudents = facultyStudents
    .filter((s) => allLeaves.some((l) => l.student_id === s.student_id))
    .map((s) => {
      const leaves = allLeaves.filter((l) => l.student_id === s.student_id);
      return {
        ...s,
        total_leaves: leaves.length,
        pending_count: leaves.filter((l) => l.status === 'Pending').length,
        latest_leave_date: leaves[0] ? leaves[0].from_date : null
      };
    });

  const studentsNoLeaves = facultyStudents.filter(
    (s) => !allLeaves.some((l) => l.student_id === s.student_id)
  );

  const analyticsMap = new Map();
  facultyStudents.forEach((s) => {
    if (!analyticsMap.has(s.semester)) analyticsMap.set(s.semester, { cgpa: [], attendance: [] });
    analyticsMap.get(s.semester).cgpa.push(Number(s.cgpa_overall || 0));
    const att = allAttendance.find((a) => a.student_id === s.student_id && a.semester === s.semester);
    analyticsMap.get(s.semester).attendance.push(Number(att ? att.attendance_percentage : 0));
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
      const student = students.find((s) => Number(s.student_id) === Number(mark.student_id));
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
    (m) =>
      Number(m.student_id) === id &&
      Number(m.semester) === sem &&
      String(m.subject).toLowerCase() === String(subject).toLowerCase()
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
      const student = students.find((s) => Number(s.student_id) === Number(row.student_id));
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

  const existing = allAttendance.find((a) => Number(a.student_id) === id && Number(a.semester) === sem);
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
  const student = students.find((s) => s.student_id === id);
  if (!student) return null;
  return {
    student,
    leaves: allLeaves.filter((l) => l.student_id === id),
    attendance: allAttendance.filter((a) => a.student_id === id),
    marks: allMarks.filter((m) => m.student_id === id),
    fees: allFees.filter((f) => f.student_id === id)
  };
};

const getFallbackAdminData = () => {
  const studentCount = students.length;
  const deptSet = new Set(students.map((s) => s.department));
  const passCount = students.filter((s) => Number(s.cgpa_overall) >= 5).length;

  const departmentBreakdown = Array.from(deptSet).map((department) => ({
    department,
    total: students.filter((s) => s.department === department).length
  }));

  const semSet = new Set(students.map((s) => s.semester));
  const performance = Array.from(semSet)
    .sort((a, b) => a - b)
    .map((semester) => {
      const rows = students.filter((s) => s.semester === semester);
      const avg = rows.reduce((sum, s) => sum + Number(s.cgpa_overall || 0), 0) / rows.length;
      return { semester, avg_cgpa: +avg.toFixed(2) };
    });

  const faculty = [
    { id: 201, user_id: 2, name: 'Dr. Maya Rao', email: 'faculty@cip.edu', department: 'Computer Science' },
    { id: 202, user_id: 4, name: 'Dr. Vikram Shah', email: 'vikram.shah@cip.edu', department: 'Electronics' }
  ];

  const queries = allQueries.map((q) => {
    const student = students.find((s) => s.student_id === q.student_id);
    return {
      ...q,
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
    students: students.map((s) => ({
      id: s.student_id,
      user_id: s.student_id + 1000,
      name: s.name,
      email: s.email,
      department: s.department,
      semester: s.semester,
      cgpa_overall: s.cgpa_overall,
      faculty_name: s.faculty_name
    })),
    faculty,
    queries,
    unreadQueryCount: queries.filter((q) => q.status === 'Unread').length
  };
};

const updateFallbackQueryStatus = (id, status) => {
  const query = allQueries.find((q) => Number(q.id) === Number(id));
  if (!query) return false;
  query.status = status;
  return true;
};

const submitFallbackLeave = (email, reason, fromDate, toDate) => {
  const profile = students.find((s) => s.email.toLowerCase() === String(email || '').toLowerCase());
  if (!profile) return false;

  const nextId = allLeaves.length ? Math.max(...allLeaves.map((l) => Number(l.id))) + 1 : 1;
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
  const leave = allLeaves.find((l) => Number(l.id) === Number(leaveId));
  if (!leave) return false;
  leave.status = status;
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
  upsertFallbackMark,
  upsertFallbackAttendance,
  updateFallbackLeaveStatus
};
