const facilityData = {
  library: {
    title: 'Central Library',
    summary: 'The central library supports academic learning with extensive print and digital collections, collaborative reading spaces, and remote-access e-journals.',
    highlights: [
      '75,000+ books across engineering, science, and management domains',
      'IEEE, Springer, and ScienceDirect digital subscriptions',
      'Dedicated discussion rooms and silent reading halls'
    ],
    stats: [
      { label: 'Books', value: '75k+' },
      { label: 'E-Journals', value: '4,500+' },
      { label: 'Reading Seats', value: '800' }
    ],
    services: ['Book lending and renewal via RFID kiosks', 'Digital library with remote login access', 'Reference support for projects and publications'],
    infrastructure: ['Three-floor reading complex with zoned sections', 'Dedicated UPS-backed digital access lab', 'Archive room for journals and thesis volumes'],
    timings: ['Monday to Friday: 8:00 AM - 8:00 PM', 'Saturday: 9:00 AM - 5:00 PM', 'Digital portal: 24x7 access'],
    outcomes: ['Improved student project quality through curated references', 'Higher publication support for PG scholars', 'Regular citation and plagiarism training workshops'],
    contact: 'Library In-Charge: library@bit.edu | +91 90000 21001'
  },
  laboratories: {
    title: 'Advanced Laboratories',
    summary: 'Department labs are equipped for core practical training, project prototyping, and industry-oriented simulation work.',
    highlights: [
      'AI, IoT, Robotics, VLSI, and CAD/CAM specialized labs',
      'Industry-grade equipment and licensed software suites',
      'Lab mentoring hours for mini and major projects'
    ],
    stats: [
      { label: 'Labs', value: '48' },
      { label: 'Centers', value: '12' },
      { label: 'Weekly Access', value: '6 days' }
    ],
    services: ['Hands-on lab sessions for all core courses', 'Open-lab slots for mini/major projects', 'Calibration and maintenance support for instruments'],
    infrastructure: ['Department-wise advanced labs with licensed software', 'Simulation and prototyping zones', 'Safety-compliant electrical and mechanical bays'],
    timings: ['Regular labs: 9:00 AM - 4:30 PM', 'Project labs: 4:30 PM - 7:00 PM', 'Special sessions on weekends (as scheduled)'],
    outcomes: ['Industry-ready practical skills', 'Prototype development for hackathons and competitions', 'Improved lab-to-industry transition via experiential learning'],
    contact: 'Lab Coordination Cell: labs@bit.edu | +91 90000 21002'
  },
  'smart-campus': {
    title: 'Smart Digital Campus',
    summary: 'The campus network offers secure high-speed connectivity, learning automation, and integrated student services.',
    highlights: [
      'End-to-end Wi-Fi coverage in academic and hostel zones',
      'Smart classroom boards with lecture capture',
      'Unified mobile app for attendance, timetables, and alerts'
    ],
    stats: [
      { label: 'Wi-Fi Uptime', value: '99.8%' },
      { label: 'Smart Rooms', value: '45+' },
      { label: 'Bandwidth', value: '2 Gbps' }
    ],
    services: ['Single-sign-on for academic services', 'Digital attendance and timetable updates', 'Realtime notices via web and mobile app'],
    infrastructure: ['Campus fiber backbone with secured VLAN setup', 'Interactive smart boards and hybrid classroom setup', 'Centralized surveillance and access control network'],
    timings: ['Network services: 24x7', 'Student service desk: 9:00 AM - 5:00 PM', 'Technical support: 8:00 AM - 8:00 PM'],
    outcomes: ['Faster academic communication and alerts', 'Reduced manual paperwork in administration', 'Improved blended learning adoption'],
    contact: 'IT Services Desk: itsupport@bit.edu | +91 90000 21003'
  },
  'sports-complex': {
    title: 'Sports and Fitness Complex',
    summary: 'Comprehensive indoor and outdoor facilities support athletic excellence, recreation, and student wellness.',
    highlights: [
      'Cricket, football, basketball, volleyball, and athletics grounds',
      'Indoor badminton courts, table tennis, and chess arena',
      'Certified gym trainers and intercollegiate coaching support'
    ],
    stats: [
      { label: 'Play Areas', value: '18' },
      { label: 'Teams', value: '30+' },
      { label: 'Gym Access', value: '6AM-9PM' }
    ],
    services: ['Professional coaching in major sports disciplines', 'Fitness assessment and training plans', 'Inter-department and inter-college tournament management'],
    infrastructure: ['Multi-court indoor arena and synthetic outdoor courts', 'Modern gym with cardio and strength equipment', 'Recovery and first-aid support station'],
    timings: ['Morning session: 6:00 AM - 9:00 AM', 'Evening session: 4:00 PM - 9:00 PM', 'Weekend coaching camps'],
    outcomes: ['Strong student participation in zonal events', 'Improved physical wellness indicators', 'Sports scholarships and representation opportunities'],
    contact: 'Physical Education Office: sports@bit.edu | +91 90000 21004'
  },
  'research-center': {
    title: 'Research and Innovation Center',
    summary: 'A structured research ecosystem encourages funded projects, patents, startups, and publications.',
    highlights: [
      'Seed grants for interdisciplinary student-faculty projects',
      'Patent filing and publication mentoring cells',
      'Industry consultancy and startup incubation guidance'
    ],
    stats: [
      { label: 'Patents', value: '28' },
      { label: 'Funded Projects', value: '64' },
      { label: 'Startups Incubated', value: '22' }
    ],
    services: ['Project grant proposal mentoring', 'IPR, patent drafting, and filing support', 'Industry consultancy facilitation'],
    infrastructure: ['Interdisciplinary research labs and testing zones', 'Innovation studio with prototyping toolkits', 'Incubation cubicles for startup teams'],
    timings: ['Center operations: 9:00 AM - 6:00 PM', 'Mentoring clinics: every Wednesday and Saturday', 'Research lab access with supervisor approval'],
    outcomes: ['Increase in funded research and consultancy projects', 'Higher patent filing and publication count', 'Student startup acceleration through incubation'],
    contact: 'Research Office: research@bit.edu | +91 90000 21005'
  },
  auditorium: {
    title: 'Main Auditorium',
    summary: 'The auditorium hosts conferences, cultural festivals, placement drives, and national-level technical events.',
    highlights: [
      'Tiered seating with premium stage acoustics',
      '4K projection, live stream setup, and green room support',
      'Multiple seminar halls for parallel sessions'
    ],
    stats: [
      { label: 'Capacity', value: '1,500' },
      { label: 'Events/Year', value: '120+' },
      { label: 'Seminar Halls', value: '6' }
    ],
    services: ['Event planning and stage management support', 'Audio-visual and live-stream technical crew', 'Conference and seminar coordination assistance'],
    infrastructure: ['1500-seat acoustically treated main hall', '4K projection and multi-camera recording setup', 'Backstage, green rooms, and speaker lounge'],
    timings: ['Booking window: 9:30 AM - 4:30 PM', 'Event operations: as per approved schedule', 'Technical rehearsal slots available on request'],
    outcomes: ['National-level conferences hosted annually', 'Improved student exposure through expert talks', 'High-quality execution of campus flagship events'],
    contact: 'Event Operations Desk: auditorium@bit.edu | +91 90000 21006'
  }
};

const renderFacilityDetails = (facilityKey) => {
  const detail = facilityData[facilityKey];
  if (!detail) return;

  const title = document.getElementById('facilityDetailTitle');
  const summary = document.getElementById('facilityDetailSummary');
  const highlights = document.getElementById('facilityDetailHighlights');
  const services = document.getElementById('facilityDetailServices');
  const infrastructure = document.getElementById('facilityDetailInfra');
  const timings = document.getElementById('facilityDetailTimings');
  const outcomes = document.getElementById('facilityDetailOutcomes');
  const contact = document.getElementById('facilityDetailContact');
  const stats = document.getElementById('facilityDetailStats');

  if (!title || !summary || !highlights || !services || !infrastructure || !timings || !outcomes || !contact || !stats) return;

  title.textContent = detail.title;
  summary.textContent = detail.summary;

  highlights.innerHTML = detail.highlights.map((item) => `<li>${item}</li>`).join('');
  services.innerHTML = detail.services.map((item) => `<li>${item}</li>`).join('');
  infrastructure.innerHTML = detail.infrastructure.map((item) => `<li>${item}</li>`).join('');
  timings.innerHTML = detail.timings.map((item) => `<li>${item}</li>`).join('');
  outcomes.innerHTML = detail.outcomes.map((item) => `<li>${item}</li>`).join('');
  contact.textContent = detail.contact;
  stats.innerHTML = detail.stats
    .map((item) => `<article><h5>${item.value}</h5><p>${item.label}</p></article>`)
    .join('');
};

const initFacilityDetails = () => {
  const cards = document.querySelectorAll('.facility-card-action');
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-facility');
      renderFacilityDetails(key);

      cards.forEach((other) => {
        const isSelected = other === card;
        other.classList.toggle('is-active', isSelected);
        other.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      });
    });
  });

  renderFacilityDetails('library');
};

document.addEventListener('DOMContentLoaded', initFacilityDetails);
