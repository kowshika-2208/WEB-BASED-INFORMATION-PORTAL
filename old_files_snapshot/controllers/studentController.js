const PDFDocument = require('pdfkit');
const {
  getStudentDashboard,
  submitLeave,
  findStudentByUserId,
  submitQueryToAdmin
} = require('../models/studentModel');
const {
  isDbUnavailable,
  getFallbackStudentDashboard,
  submitFallbackLeave
} = require('../utils/fallbackData');

const loadStudentData = async (req, res) => {
  let data;
  try {
    data = await getStudentDashboard(req.user.id);
  } catch (error) {
    if (isDbUnavailable(error)) {
      return getFallbackStudentDashboard(req.user.email);
    }
    throw error;
  }
  if (!data) {
    res.status(404).render('partials/error', {
      title: 'Not Found',
      message: 'Student record was not found.',
      user: req.user
    });
    return null;
  }
  return data;
};

const showOverview = async (req, res, next) => {
  try {
    const data = await loadStudentData(req, res);
    if (!data) return;

    return res.render('student/dashboard', {
      title: 'Student Dashboard',
      user: req.user,
      data,
      activeSection: 'overview'
    });
  } catch (error) {
    return next(error);
  }
};

const showAcademics = async (req, res, next) => {
  try {
    const data = await loadStudentData(req, res);
    if (!data) return;

    return res.render('student/academics', {
      title: 'Student Academics',
      user: req.user,
      data,
      activeSection: 'academics'
    });
  } catch (error) {
    return next(error);
  }
};

const showPersonal = async (req, res, next) => {
  try {
    const data = await loadStudentData(req, res);
    if (!data) return;

    return res.render('student/personal', {
      title: 'Student Personal Info',
      user: req.user,
      data,
      activeSection: 'personal'
    });
  } catch (error) {
    return next(error);
  }
};

const showFees = async (req, res, next) => {
  try {
    const data = await loadStudentData(req, res);
    if (!data) return;

    return res.render('student/fees', {
      title: 'Student Fees',
      user: req.user,
      data,
      activeSection: 'fees'
    });
  } catch (error) {
    return next(error);
  }
};

const showLeaves = async (req, res, next) => {
  try {
    const data = await loadStudentData(req, res);
    if (!data) return;

    return res.render('student/leaves', {
      title: 'Student Leaves',
      user: req.user,
      data,
      activeSection: 'leaves'
    });
  } catch (error) {
    return next(error);
  }
};

const showHallTicketPage = async (req, res, next) => {
  try {
    const data = await loadStudentData(req, res);
    if (!data) return;

    return res.render('student/hall-ticket', {
      title: 'Student Hall Ticket',
      user: req.user,
      data,
      activeSection: 'hall-ticket'
    });
  } catch (error) {
    return next(error);
  }
};

const applyLeave = async (req, res, next) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return res.redirect('/student/dashboard');

    await submitLeave(student.id, req.body.reason, req.body.from_date, req.body.to_date);
    return res.redirect('/student/dashboard#leave');
  } catch (error) {
    if (isDbUnavailable(error)) {
      submitFallbackLeave(req.user.email, req.body.reason, req.body.from_date, req.body.to_date);
      return res.redirect('/student/dashboard#leave');
    }
    return next(error);
  }
};

const submitQuery = async (req, res, next) => {
  try {
    const student = await findStudentByUserId(req.user.id);
    if (!student) return res.redirect('/student/dashboard');

    await submitQueryToAdmin(student.id, req.body.subject, req.body.message);
    return res.redirect('/student/dashboard');
  } catch (error) {
    return next(error);
  }
};

const downloadHallTicket = async (req, res, next) => {
  try {
    const dashboard = await getStudentDashboard(req.user.id);
    if (!dashboard) return res.redirect('/student/dashboard');

    if (!dashboard.profile.hall_ticket_available) {
      return res.status(400).render('partials/error', {
        title: 'Unavailable',
        message: 'Hall ticket is not available yet.',
        user: req.user
      });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=hall-ticket.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('College Information Portal - Hall Ticket', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${dashboard.profile.name}`);
    doc.text(`Department: ${dashboard.profile.department}`);
    doc.text(`Semester: ${dashboard.profile.semester}`);
    doc.text(`Faculty In-Charge: ${dashboard.profile.faculty_name || 'N/A'}`);
    doc.text(`Email: ${dashboard.profile.email}`);
    doc.moveDown();
    doc.text('This hall ticket is system generated and valid for semester examinations.');
    doc.end();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  showOverview,
  showAcademics,
  showPersonal,
  showFees,
  showLeaves,
  showHallTicketPage,
  applyLeave,
  submitQuery,
  downloadHallTicket
};
