const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findByEmail } = require('../models/userModel');
const { isDbUnavailable, findFallbackUserByCredentials } = require('../utils/fallbackData');

const DEPARTMENT_BASE = [
  {
    name: 'Aeronautical Engineering',
    short: 'AERO',
    detail: 'Aerodynamics, propulsion, flight mechanics, avionics, and aircraft design systems.',
    icon: '&#9992;'
  },
  {
    name: 'Agricultural Engineering',
    short: 'AGRI',
    detail: 'Farm mechanization, soil and water conservation, agri-automation, and post-harvest technologies.',
    icon: '&#127806;'
  },
  {
    name: 'Artificial Intelligence and Data Science',
    short: 'AI&DS',
    detail: 'Focused on machine learning, deep learning, data engineering, and responsible AI systems.',
    icon: '&#129504;'
  },
  {
    name: 'Artificial Intelligence and Machine Learning',
    short: 'AI&ML',
    detail: 'Core training in intelligent systems, neural networks, and real-world ML deployment.',
    icon: '&#129504;'
  },
  {
    name: 'Automobile Engineering',
    short: 'AUTO',
    detail: 'Automotive design, vehicle dynamics, hybrid systems, and EV technologies.',
    icon: '&#128663;'
  },
  {
    name: 'Biomedical Engineering',
    short: 'BME',
    detail: 'Medical instrumentation, healthcare devices, biosignals, and clinical engineering innovation.',
    icon: '&#9877;'
  },
  {
    name: 'Biotechnology',
    short: 'BT',
    detail: 'Life science engineering focused on genetics, molecular biology, and industrial biotechnology.',
    icon: '&#129516;'
  },
  {
    name: 'Civil Engineering',
    short: 'CIVIL',
    detail: 'Structural engineering, environmental engineering, geotechnical, and urban planning.',
    icon: '&#127959;'
  },
  {
    name: 'Computer Science and Business Systems',
    short: 'CSBS',
    detail: 'Blends computer science with business analytics, fintech, and enterprise systems.',
    icon: '&#128188;'
  },
  {
    name: 'Computer Science and Engineering',
    short: 'CSE',
    detail: 'Software engineering, AI, cybersecurity, cloud computing, and full-stack development.',
    icon: '&#9881;'
  },
  {
    name: 'Computer Technology',
    short: 'CT',
    detail: 'Computer hardware, systems programming, networking, and platform technologies.',
    icon: '&#128421;'
  },
  {
    name: 'Computer Science and Design',
    short: 'CSD',
    detail: 'Human-centered computing, UI/UX, product design, and creative software systems.',
    icon: '&#127912;'
  },
  {
    name: 'Electrical and Electronics Engineering',
    short: 'EEE',
    detail: 'Power systems, control systems, renewable energy, and electrical machines.',
    icon: '&#9889;'
  },
  {
    name: 'Electronics and Communication Engineering',
    short: 'ECE',
    detail: 'VLSI design, embedded systems, wireless communication, and signal processing.',
    icon: '&#128246;'
  },
  {
    name: 'Electronics and Instrumentation Engineering',
    short: 'EIE',
    detail: 'Industrial instrumentation, process control, automation, and smart sensing systems.',
    icon: '&#128300;'
  },
  {
    name: 'Fashion Technology',
    short: 'FT',
    detail: 'Apparel production, fashion design systems, textiles, and garment technology.',
    icon: '&#128085;'
  },
  {
    name: 'Food Technology',
    short: 'FOOD',
    detail: 'Food processing, quality assurance, packaging systems, and sustainable food technologies.',
    icon: '&#127858;'
  },
  {
    name: 'Information Science and Engineering',
    short: 'ISE',
    detail: 'Data structures, information systems, AI, and large-scale software architecture.',
    icon: '&#128202;'
  },
  {
    name: 'Information Technology',
    short: 'IT',
    detail: 'Software development, cloud systems, networking, and enterprise IT solutions.',
    icon: '&#128187;'
  },
  {
    name: 'Mechanical Engineering',
    short: 'MECH',
    detail: 'Thermal engineering, manufacturing, robotics, and CAD/CAM technologies.',
    icon: '&#128295;'
  },
  {
    name: 'Mechatronics',
    short: 'MECHA',
    detail: 'Integrated curriculum across mechanical systems, electronics, embedded control, and industrial automation.',
    icon: '&#129302;'
  },
  {
    name: 'Textile Technology',
    short: 'TEXT',
    detail: 'Textile production, fiber science, process engineering, and sustainable fabrics.',
    icon: '&#129525;'
  }
];

const HOD_NAMES = [
  'Dr. Maya Rao',
  'Dr. Sandeep Kumar',
  'Dr. Vikram Shah',
  'Dr. Priya Narayanan',
  'Dr. Nisha Verma',
  'Dr. Srinivas Reddy',
  'Dr. Gomathi R',
  'Dr. Chelladurai V',
  'Dr. Kavya Iyer',
  'Dr. Arjun Mehta',
  'Dr. Ramya K',
  'Dr. Gopinath S',
  'Dr. Harish Babu',
  'Dr. Asha R',
  'Dr. Meera Nair',
  'Dr. Pranathi R',
  'Dr. Manoj T',
  'Dr. Lakshmi Priya'
];

const FACULTY_FIRST_NAMES = ['Akhil', 'Meera', 'Vikram', 'Priya', 'Nisha', 'Rahul', 'Kavya', 'Arun', 'Shalini', 'Sonia', 'Ravi', 'Divya'];
const FACULTY_LAST_NAMES = ['Kumar', 'Rao', 'Iyer', 'Nair', 'Shah', 'Menon', 'Patel', 'Verma', 'Reddy', 'Krishnan', 'Mohan', 'Prasad'];
const FACULTY_DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Assistant Professor'];

const toSlug = (value) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const buildDepartmentProfile = (department, index) => {
  const slug = toSlug(department.name);
  const facultyMembers = Array.from({ length: 6 }).map((_, facultyIndex) => {
    const nameSeed = (index * 5) + facultyIndex;
    const first = FACULTY_FIRST_NAMES[nameSeed % FACULTY_FIRST_NAMES.length];
    const last = FACULTY_LAST_NAMES[(nameSeed + 3) % FACULTY_LAST_NAMES.length];

    return {
      name: `Dr. ${first} ${last}`,
      designation: FACULTY_DESIGNATIONS[facultyIndex % FACULTY_DESIGNATIONS.length],
      specialization: `${department.short} - Advanced Research Area ${facultyIndex + 1}`
    };
  });

  return {
    ...department,
    slug,
    established: 2008 + (index % 12),
    bannerImage: `/images/campus/departments/${slug}.jpg`,
    overview: `The Department of ${department.name} offers a career-focused curriculum with strong laboratory exposure, project-based learning, and continuous industry collaboration. Students are trained through internships, value-added courses, technical clubs, and innovation challenges to become globally competent professionals.`,
    vision: `To become a center of excellence in ${department.name} education, research, innovation, and societal impact.`,
    mission: [
      `Deliver outcome-based teaching and hands-on learning in ${department.name}.`,
      'Promote interdisciplinary projects, entrepreneurship, and research culture among students.',
      'Build strong academia-industry partnerships through internships, consulting, and joint innovation.'
    ],
    peo: [
      `Graduates will apply core ${department.short} knowledge to solve real-world engineering and societal problems.`,
      'Graduates will build successful careers in higher education, research, entrepreneurship, and global industries.',
      'Graduates will demonstrate ethics, teamwork, communication, and lifelong learning.'
    ],
    hod: {
      name: HOD_NAMES[index % HOD_NAMES.length],
      designation: 'Professor & Head',
      email: `${department.short.toLowerCase().replace(/[^a-z0-9]/g, '')}.hod@bit.edu`,
      phone: `+91 90000 22${String(index + 11).padStart(3, '0')}`,
      message: `Welcome to the Department of ${department.name}. We are committed to academic rigor, innovation, and student success through modern labs and mentorship.`
    },
    facultyMembers,
    supportingStaff: [
      'Laboratory Instructor Team',
      'Technical Assistant Team',
      'Department Office Coordinators'
    ],
    researchFocus: [
      `Funded projects in ${department.name} applications`,
      'Industry consultancy and collaborative product development',
      'Scopus-indexed publications and patents',
      'Professional societies and student chapters'
    ],
    programmes: [
      {
        level: 'UG',
        name: `B.Tech. - ${department.name.toUpperCase()}`,
        duration: '4 years (Regular) / 3 years (Lateral Entry)',
        semesters: '8 (Regular) / 6 (Lateral Entry)',
        seats: `${60 + ((index % 4) * 30)} seats`,
        eligibility: '10+2 with Physics, Chemistry and Mathematics with qualifying marks as per university norms.',
        syllabusYears: ['2018', '2020', '2022', '2025'],
        higherStudies: 'M.E. / M.Tech. / M.S. / MBA / Research'
      },
      {
        level: 'PG',
        name: `M.Tech. - Advanced ${department.short}`,
        duration: '2 years',
        semesters: '4',
        seats: `${18 + ((index % 3) * 6)} seats`,
        eligibility: 'Relevant UG degree with qualifying entrance score / merit.',
        syllabusYears: ['2019', '2021', '2024'],
        higherStudies: 'Ph.D. / Research Fellowships / Industrial R&D'
      }
    ]
  };
};

const getDepartmentProfiles = () => DEPARTMENT_BASE.map((department, index) => buildDepartmentProfile(department, index));
const getDepartmentCatalog = () => getDepartmentProfiles().map(({ slug, name, short, detail, icon }) => ({ slug, name, short, detail, icon }));
const findDepartmentBySlug = (slug) => getDepartmentProfiles().find((department) => department.slug === slug);

const showLogin = (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('auth/login', {
    title: 'Login',
    error: null,
    home: getPublicHomeData(),
    user: null
  });
};

const getPublicHomeData = () => ({
  collegeName: 'BIT',
  heroTitle: 'Join Our Community',
  heroSubtitle: 'Admissions open for 2026-27',
  stats: [
    { value: `${getDepartmentCatalog().length}+`, label: 'Departments', icon: 'book' },
    { value: '5000+', label: 'Students', icon: 'users' },
    { value: '120+', label: 'Awards', icon: 'award' }
  ],
  announcements: [
    {
      title: 'Admissions Open for 2026-27',
      date: 'Feb 10, 2026',
      detail: 'Applications are now being accepted for all undergraduate programs.',
      status: 'Open',
      time: '09:00 AM - 05:00 PM',
      venue: 'Admissions Office & Online Portal',
      cta: 'Apply before April 30, 2026.'
    },
    {
      title: 'Annual Sports Meet',
      date: 'Mar 5, 2026',
      detail: 'Register for the inter-departmental sports competition.',
      status: 'Today',
      time: '08:30 AM onwards',
      venue: 'Main Ground and Indoor Arena',
      cta: 'Team registrations close by 04:00 PM today.'
    },
    {
      title: 'Hackathon 2026',
      date: 'Mar 15, 2026',
      detail: '24-hour coding challenge with exciting prizes. Open to all students.',
      status: 'Upcoming',
      time: 'Starts 09:00 AM',
      venue: 'Innovation and Incubation Center',
      cta: 'Submit your team idea deck by March 10, 2026.'
    },
    {
      title: 'Guest Lecture: AI & Future',
      date: 'Feb 20, 2026',
      detail: 'Dr. Raj Kumar will speak on the future of Artificial Intelligence.',
      status: 'Completed',
      time: '11:00 AM - 12:30 PM',
      venue: 'Seminar Hall A',
      cta: 'Recording and slides are available with the department office.'
    }
  ],
  contact: {
    address: '123 College Road, City',
    phone: '+91 98765 43210',
    email: 'info@prestigecollege.edu'
  },
  departments: getDepartmentCatalog(),
  courses: [
    { name: 'B.Tech Computer Science', duration: '4 Years', eligibility: '10+2 with PCM (60%+)', type: 'UG' },
    { name: 'B.Tech Information Technology', duration: '4 Years', eligibility: '10+2 with PCM (60%+)', type: 'UG' },
    { name: 'B.Tech Electronics & Communication', duration: '4 Years', eligibility: '10+2 with PCM (60%+)', type: 'UG' },
    { name: 'B.Tech Electrical & Electronics', duration: '4 Years', eligibility: '10+2 with PCM (55%+)', type: 'UG' },
    { name: 'B.Tech Mechanical Engineering', duration: '4 Years', eligibility: '10+2 with PCM (55%+)', type: 'UG' },
    { name: 'B.Tech Civil Engineering', duration: '4 Years', eligibility: '10+2 with PCM (55%+)', type: 'UG' },
    { name: 'M.Tech Computer Science', duration: '2 Years', eligibility: 'B.Tech CSE/IT (60%+)', type: 'PG' },
    { name: 'M.Tech VLSI Design', duration: '2 Years', eligibility: 'B.Tech ECE/EEE (60%+)', type: 'PG' },
    { name: 'MBA', duration: '2 Years', eligibility: 'Any Graduate (55%+)', type: 'PG' },
    { name: 'MCA', duration: '2 Years', eligibility: 'BCA/B.Sc CS (55%+)', type: 'PG' },
    { name: 'Ph.D. (Various Departments)', duration: '3-5 Years', eligibility: 'M.Tech/MBA (65%+)', type: 'Research' }
  ]
});

const getCollegeData = () => ({
  name: 'Crestfield Institute of Technology',
  tagline: 'Innovation, Integrity, Impact',
  overview:
    'Crestfield Institute of Technology is a multidisciplinary college focused on academic excellence, industry collaboration, and student success through modern infrastructure and experiential learning.',
  facilities: [
    'Central digital library with 120,000+ books and journals',
    'Advanced AI, Robotics, IoT, and Cloud innovation labs',
    'Smart classrooms with interactive boards and lecture capture',
    '24x7 campus Wi-Fi and high-performance computing center',
    'Hostels, cafeteria, sports complex, gym, and health center',
    'Incubation center and startup mentorship hub'
  ],
  facultyMembers: [
    { name: 'Dr. Maya Rao', designation: 'Professor - Computer Science', specialization: 'Machine Learning' },
    { name: 'Dr. Vikram Shah', designation: 'Associate Professor - Electronics', specialization: 'Embedded Systems' },
    { name: 'Dr. Nisha Verma', designation: 'Professor - Mechanical', specialization: 'Advanced Manufacturing' },
    { name: 'Dr. Arjun Mehta', designation: 'Assistant Professor - Data Science', specialization: 'Big Data Analytics' }
  ],
  departments: [
    'Aeronautical Engineering',
    'Agricultural Engineering',
    'Artificial Intelligence and Data Science',
    'Artificial Intelligence and Machine Learning',
    'Automobile Engineering',
    'Biomedical Engineering',
    'Biotechnology',
    'Civil Engineering',
    'Computer Science and Business Systems',
    'Computer Science and Engineering',
    'Computer Technology',
    'Computer Science and Design',
    'Electrical and Electronics Engineering',
    'Electronics and Communication Engineering',
    'Electronics and Instrumentation Engineering',
    'Fashion Technology',
    'Food Technology',
    'Information Science and Engineering',
    'Information Technology',
    'Mechanical Engineering',
    'Mechatronics',
    'Textile Technology'
  ],
  admissions: {
    process: [
      'Online registration and profile submission',
      'Entrance score / merit evaluation',
      'Counselling and seat allotment',
      'Document verification and fee payment'
    ],
    contactEmail: 'admissions@crestfield.edu',
    helpline: '+1-800-555-ADMIT'
  },
  programmesOffered: [
    'B.Tech (CSE, ECE, ME, CE, IT)',
    'M.Tech (AI, VLSI, Thermal Engineering)',
    'MBA (Business Analytics, Finance, Marketing)',
    'Ph.D. Programs across Engineering and Management'
  ],
  placements: {
    topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Deloitte', 'Infosys', 'TCS'],
    highestPackage: '32 LPA',
    averagePackage: '8.4 LPA',
    placementRate: '92%'
  },
  achievements: [
    'Ranked among Top 25 private engineering institutes in the region',
    'National innovation award for student-led smart mobility project',
    '3 international patents filed in the last academic year',
    'Winners of inter-college AI Grand Challenge 2025'
  ],
  upcomingEvents: [
    { title: 'CrestHack 2026', date: 'March 20-21, 2026', detail: '48-hour national hackathon on AI, health, and sustainability.' },
    { title: 'Industry Connect Summit', date: 'April 5, 2026', detail: 'Leadership talks by CTOs and hiring partners.' },
    { title: 'Research Expo', date: 'April 26, 2026', detail: 'Showcase of final-year and postgraduate research projects.' }
  ],
  careers: [
    'Assistant Professor - Computer Science',
    'Lab Engineer - Electronics',
    'Placement and Corporate Relations Officer',
    'Admissions Counsellor'
  ],
  contactUs: {
    address: '1450 University Park Drive, Springfield, USA',
    phone: '+1-800-555-0123',
    email: 'info@crestfield.edu',
    hours: 'Mon-Sat, 9:00 AM - 5:30 PM'
  }
});

const showAboutCollege = (req, res) => {
  const college = getCollegeData();

  return res.render('auth/about-college', {
    title: 'About College',
    home: getPublicHomeData(),
    college,
    user: req.user || null
  });
};

const showHome = (req, res) => {
  if (req.user) {
    if (req.user.role === 'admin') return res.redirect('/admin/dashboard');
    if (req.user.role === 'faculty') return res.redirect('/faculty/dashboard');
    return res.redirect('/student/dashboard');
  }

  return res.render('auth/home', {
    title: 'Home',
    home: getPublicHomeData(),
    user: null
  });
};

const showContact = (req, res) => {
  const home = getPublicHomeData();
  const college = getCollegeData();

  return res.render('auth/contact', {
    title: 'Contact',
    home,
    contactUs: college.contactUs,
    user: req.user || null
  });
};

const showDepartments = (req, res) => {
  return res.render('auth/departments', {
    title: 'Departments',
    home: getPublicHomeData(),
    user: req.user || null
  });
};

const showDepartmentDetail = (req, res) => {
  const department = findDepartmentBySlug(req.params.slug);

  if (!department) {
    return res.status(404).render('partials/error', {
      title: 'Department Not Found',
      message: 'The requested department page is unavailable.',
      user: req.user || null
    });
  }

  return res.render('auth/department-detail', {
    title: department.name,
    home: getPublicHomeData(),
    department,
    user: req.user || null
  });
};

const getFacultyDirectoryData = () => (
  getDepartmentCatalog().map((department, index) => ({
    department: department.name,
    members: [
      { name: HOD_NAMES[index % HOD_NAMES.length], designation: 'Professor & Head', roleType: 'HOD' },
      { name: `Dr ${FACULTY_FIRST_NAMES[(index + 1) % FACULTY_FIRST_NAMES.length]} ${FACULTY_LAST_NAMES[(index + 2) % FACULTY_LAST_NAMES.length]}`, designation: 'Professor', roleType: 'Faculty' },
      { name: `Dr ${FACULTY_FIRST_NAMES[(index + 3) % FACULTY_FIRST_NAMES.length]} ${FACULTY_LAST_NAMES[(index + 4) % FACULTY_LAST_NAMES.length]}`, designation: 'Associate Professor', roleType: 'Faculty' },
      { name: `Dr ${FACULTY_FIRST_NAMES[(index + 5) % FACULTY_FIRST_NAMES.length]} ${FACULTY_LAST_NAMES[(index + 6) % FACULTY_LAST_NAMES.length]}`, designation: 'Assistant Professor', roleType: 'Faculty' }
    ]
  }))
);

const showFacultyDirectory = (req, res) => {
  return res.render('auth/faculty', {
    title: 'Faculty',
    home: getPublicHomeData(),
    facultyDirectory: getFacultyDirectoryData(),
    user: req.user || null
  });
};

const getPlacementInsights = () => ({
  overall: {
    highestPackageLpa: 42,
    averagePackageLpa: 8.9,
    placementRate: 93
  },
  intro:
    'The Training and Placement Cell bridges academia and industry through focused training, strong recruiter relationships, and career mentoring support. Students receive continuous preparation in aptitude, coding, communication, interview strategy, and professional behavior.',
  recruitersSay: [
    '"BIT students consistently demonstrate strong fundamentals, discipline, and execution quality in live project environments." - Talent Partner, Google',
    '"The institute produces industry-ready graduates with excellent adaptability and team collaboration skills." - Hiring Lead, Microsoft'
  ],
  placementMenu: [
    { key: 'home', label: 'Home' },
    { key: 'valuable-recruiters', label: 'Valuable Recruiters' },
    { key: 'trainings-offered', label: 'Trainings Offered' },
    { key: 'industry-tieups', label: 'Industry Tieups' },
    { key: 'placement-achievements', label: 'Placement Achievements' },
    { key: 'placement-team', label: 'Placement Team' },
    { key: 'contact', label: 'Contact' }
  ],
  valuableRecruiters: [
    'Google',
    'Microsoft',
    'Amazon',
    'Cisco',
    'Deloitte',
    'Infosys',
    'TCS',
    'Accenture',
    'Zoho',
    'Capgemini',
    'Wipro',
    'Cognizant'
  ],
  trainingsOffered: [
    'Aptitude and logical reasoning bootcamps',
    'Coding rounds preparation (DSA, SQL, problem-solving)',
    'Core technical interview workshops by domain',
    'Mock group discussions and HR interview simulations',
    'Resume building, LinkedIn profile, and portfolio guidance',
    'Foreign language and communication enhancement sessions'
  ],
  trainingCategories: [
    {
      title: 'Technical & Programming Training',
      items: [
        'Programming Languages (C, C++, Java, Python)',
        'Advanced Data Structures Training',
        'Full Stack Project Development Training',
        'PEGA',
        'ServiceNow',
        'Product Fit Training',
        'Service Fit Training'
      ]
    },
    {
      title: 'Emerging Technologies & Core Engineering Training',
      items: [
        'Artificial Intelligence',
        'Machine Learning',
        'Cyber Security',
        'Big Data',
        'Thermal Engineering Training',
        'Industrial Automation Training',
        'Robotics Training',
        'ETABS Software Training',
        'Engineering Design & Manufacturing Training',
        'Automotive Embedded System Training'
      ]
    },
    {
      title: 'Career & Professional Development Training',
      items: [
        'Company Specific Training (Quantitative & Verbal Aptitude)',
        'Training for Competitive Exams',
        'Career Growth Training',
        'Communication Development Training',
        'Resume Building Training',
        'Soft Skills Training',
        'Overseas Education Training'
      ]
    }
  ],
  industryTieups: [
    'Google Developer Student Program Collaboration',
    'Microsoft Learn for Students Initiative',
    'Amazon Web Services Academy Enablement',
    'Cisco Networking Academy Certification Track',
    'Deloitte Employability Readiness Program',
    'Infosys Springboard Skill Development Alliance'
  ],
  industryTieupCompanies: [
    'Aspire Systems',
    'Bosch',
    'Cisco',
    'Delta',
    'Fanuc',
    'Festo',
    'Freescale',
    'Harita Techserv',
    'Hexaware',
    'Intel',
    'Lectra',
    'Lincoln Electric',
    'Mistral',
    'Payoda',
    'Salzer',
    'ServiceNow',
    'Siemens',
    'TCS',
    'TVS',
    'Virtusa',
    'Vuram',
    'HCLTech',
    'Oracle',
    'TalentSprint'
  ],
  placementAchievements: [
    'Highest package of 42 LPA in 2026',
    '93% overall placement rate in 2026',
    '300+ offers from product and core companies',
    '120+ students received multi-offer opportunities',
    'Consistent increase in average package for 4 years'
  ],
  placementTeam: [
    {
      name: 'Dr. Shalini Mehta',
      role: 'Director - Training and Placement',
      email: 'tpo.director@bit.edu',
      phone: '+91 90000 33001',
      image: '/images/faculty/profiles/prof-05.svg',
      responsibilities: ['Placement strategy and policy', 'Recruiter engagement and MoUs', 'Placement governance and outcomes']
    },
    {
      name: 'Dr. Vivek Anand',
      role: 'Senior Placement Officer',
      email: 'placement.officer1@bit.edu',
      phone: '+91 90000 33002',
      image: '/images/faculty/profiles/prof-06.svg',
      responsibilities: ['Campus drive coordination', 'Student interview scheduling', 'Offer management and reporting']
    },
    {
      name: 'Dr. Kavya Iyer',
      role: 'Corporate Relations Coordinator',
      email: 'corporate.relations@bit.edu',
      phone: '+91 90000 33003',
      image: '/images/faculty/profiles/prof-02.svg',
      responsibilities: ['Industry connect programs', 'Alumni and recruiter outreach', 'Partnership relationship management']
    },
    {
      name: 'Mr. Arjun Prasad',
      role: 'Aptitude Training Lead',
      email: 'aptitude.cell@bit.edu',
      phone: '+91 90000 33004',
      image: '/images/faculty/profiles/prof-03.svg',
      responsibilities: ['Aptitude and soft skills training', 'Mock interview programs', 'Pre-placement readiness tracking']
    }
  ],
  contact: {
    office: 'Training and Placement Cell, Admin Block - 2nd Floor',
    email: 'placements@bit.edu',
    phone: '+91 4295 226000',
    alternate: '+91 89401 11223',
    officers: [
      {
        name: 'Mr. Nirmal Kumar R',
        role: 'Industry Relation Officer',
        phone: '9965617722',
        image: '/images/faculty/profiles/prof-01.svg'
      },
      {
        name: 'Dr. Mathan Kumar P',
        role: 'Industry Relation Officer - Core',
        phone: '8344833839',
        image: '/images/faculty/profiles/prof-02.svg'
      },
      {
        name: 'Mr. Ranjith G',
        role: 'Placement Incharge',
        phone: '9600975790',
        image: '/images/faculty/profiles/prof-03.svg'
      },
      {
        name: 'Mr. Mohan Kumar V',
        role: 'Placement Incharge',
        phone: '9597391293',
        image: '/images/faculty/profiles/prof-04.svg'
      }
    ]
  },
  yearWise: [
    { year: '2026', eligible: 840, placed: 794, topCompany: 'Google', highestPackageLpa: 42 },
    { year: '2025', eligible: 812, placed: 742, topCompany: 'Microsoft', highestPackageLpa: 38 },
    { year: '2024', eligible: 790, placed: 708, topCompany: 'Amazon', highestPackageLpa: 34 },
    { year: '2023', eligible: 760, placed: 673, topCompany: 'Adobe', highestPackageLpa: 32 }
  ],
  topOffers: [
    { student: 'Akhil Raj', batch: '2022-2026', department: 'CSE', company: 'Google', packageLpa: 42 },
    { student: 'Meera Nair', batch: '2022-2026', department: 'AI&DS', company: 'Microsoft', packageLpa: 39 },
    { student: 'Pradeep V', batch: '2021-2025', department: 'IT', company: 'Amazon', packageLpa: 36 },
    { student: 'Nivetha K', batch: '2021-2025', department: 'ECE', company: 'Cisco', packageLpa: 33 },
    { student: 'Yogesh B', batch: '2020-2024', department: 'EEE', company: 'Deloitte', packageLpa: 29 },
    { student: 'Lavanya S', batch: '2020-2024', department: 'MECH', company: 'Infosys', packageLpa: 26 }
  ],
  batchWise: [
    { batch: '2022-2026', totalStudents: 920, placedStudents: 794, placementRate: 86.3 },
    { batch: '2021-2025', totalStudents: 890, placedStudents: 742, placementRate: 83.4 },
    { batch: '2020-2024', totalStudents: 860, placedStudents: 708, placementRate: 82.3 },
    { batch: '2019-2023', totalStudents: 825, placedStudents: 673, placementRate: 81.6 }
  ]
});

const showPlacements = (req, res) => {
  return res.render('auth/placements', {
    title: 'Placements',
    home: getPublicHomeData(),
    placements: getPlacementInsights(),
    user: req.user || null
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let user;

    try {
      user = await findByEmail(email);
    } catch (error) {
      if (isDbUnavailable(error)) {
        const fallbackUser = findFallbackUserByCredentials(email, password);
        if (!fallbackUser) {
          return res.status(401).render('auth/login', {
            title: 'Login',
            error: 'Invalid credentials.',
            home: getPublicHomeData(),
            user: null
          });
        }

        const token = jwt.sign(
          {
            id: fallbackUser.id,
            name: fallbackUser.name,
            email: fallbackUser.email,
            role: fallbackUser.role
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.cookie('token', token, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        });

        if (fallbackUser.role === 'admin') return res.redirect('/admin/dashboard');
        if (fallbackUser.role === 'faculty') return res.redirect('/faculty/dashboard');
        return res.redirect('/student/dashboard');
      }

      throw error;
    }

    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid credentials.',
        home: getPublicHomeData(),
        user: null
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid credentials.',
        home: getPublicHomeData(),
        user: null
      });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    if (user.role === 'faculty') return res.redirect('/faculty/dashboard');
    return res.redirect('/student/dashboard');
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  return res.redirect('/login');
};

module.exports = {
  showHome,
  showLogin,
  showAboutCollege,
  showContact,
  showDepartments,
  showDepartmentDetail,
  showFacultyDirectory,
  showPlacements,
  login,
  logout
};
