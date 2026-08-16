const fs = require('fs');

const snapshot = {
  course: {
    id: '4',
    code: '25PCC12EC05',
    title: 'Electronic Devices',
    course_type: 'THEORY',
    lecture_hours: 2,
    tutorial_hours: 0,
    practical_hours: 2,
    self_learning_hours: 0,
    credits: 3,
    internal_marks: 50,
    external_marks: 50,
    pre_requisites: 'Basic Electrical and Electronics Engineering\nFundamentals of Electromagnetics and Semiconductor Devices',
    objectives: '',
    syllabus_intro: ''
  },
  outcomes: [
    { code: 'CO1', description: 'Explain the working of semiconductor devices.' },
    { code: 'CO2', description: 'Interpret the characteristics of semiconductor devices.' },
    { code: 'CO3', description: 'Explain characteristics of power electronics and optoelectronic devices.' },
    { code: 'CO4', description: 'Apply the optoelectronic and power electronic devices for various applications' }
  ],
  modules: [
    { number: 1, title: 'Bipolar Junction Transistors', contact_hours: 5, content: 'Minority carrier distributions and terminal currents, Generalized Biasing: The Coupled-Diode Model, Charge control analysis; switching, drift in base region, base narrowing, avalanche breakdown, thermal effects, Kirk effect. Uni-junction Transistor (UJT)' },
    { number: 2, title: 'Field Effect Transistors', contact_hours: 5, content: 'JFET (characteristics), MOS capacitor (threshold voltage, C-V characteristics). MOSFET: I-V characteristics, Equivalent circuits for the MOSFET.' },
    { number: 3, title: 'MOS Transistor', contact_hours: 5, content: 'MOS Transistor under Static Conditions, Dynamic Behaviour, Secondary Effects. SPICE Models for MOS Transistor, Technology Scaling' },
    { number: 4, title: 'Optoelectronic Devices', contact_hours: 5, content: 'Photodiodes: I-V characteristics in an illuminated junction, Solar Cells, Photodetectors. LEDs, Semiconductor LASER' },
    { number: 5, title: 'Power Semiconductor Devices', contact_hours: 6, content: 'SCR (Silicon Controlled Rectifier): two transistor model, protection circuits, series and parallel operation of SCR, triggering and commutation circuits. GTO, TRIAC, DIAC, Power Diode, Power BJT, Power MOSFET, IGBT.' }
  ],
  experiments: [
    { number: 1, title: 'Input & Output Characteristics of BJT in Common Emitter (CE) Configuration', hours: 2 },
    { number: 2, title: 'Simulation of Input & Output Characteristics of BJT (CE Configuration)', hours: 2 },
    { number: 3, title: 'Uni-junction Transistor (UJT) V-I Characteristics', hours: 2 },
    { number: 4, title: 'UJT as Relaxation Oscillator', hours: 2 },
    { number: 5, title: 'Junction Field Effect Transistor (JFET) V-I & Transfer Characteristics', hours: 2 },
    { number: 6, title: 'Simulation of MOSFET Transfer & Output Characteristics', hours: 2 },
    { number: 7, title: 'Simulation of Channel Length Modulation for MOSFET (Secondary Effects)', hours: 2 },
    { number: 8, title: 'Silicon Controlled Rectifier (SCR) V-I Characteristics', hours: 2 }
  ],
  assessments: [
    { component: 'ISE-1', marks: 20, description: 'Quiz/crossword and Poster making' },
    { component: 'ISE-2', marks: 20, description: '3D model making and Open Book Test' },
    { component: 'MSE', marks: 30, description: '90 Minutes written examination based on 50% syllabus' },
    { component: 'ESE', marks: 30, description: '90 Minutes written examination based on remaining 50% syllabus' }
  ],
  reference_books: [
    { title: 'Solid State Electronic Devices', authors: 'B.G. Streetman, S. K. Banerjee', publisher: 'Pearson India', edition: '7th', year: '2017' },
    { title: 'Power Electronics: Circuits, Devices & Applications', authors: 'M.H. Rashid', publisher: 'Pearson India', edition: '4th', year: '2017' },
    { title: 'Physics of Semiconductor Devices', authors: 'S. M. Sze', publisher: 'John Wiley & Sons', edition: '3rd', year: '2007' },
    { title: 'Semiconductor Physics and Devices: Basic Principles', authors: 'Donald. A. Neamen', publisher: 'McGraw Hill', edition: '4th', year: '2011' }
  ]
};

const sql = `
INSERT INTO course_versions (id, course_id, version_number, snapshot, change_summary)
VALUES ('v-123456789', '4', 100, '${JSON.stringify(snapshot).replace(/'/g, "''")}', '2025 version data');
`;

fs.writeFileSync('seed_history.sql', sql);
console.log('Created seed_history.sql');
