import type { CourseDraft } from "@/types/curriculum";

export type PrintDepartment = {
  id: number;
  code: string;
  name: string;
  college_name: string;
  university_name: string;
};

export type PrintAcademicYear = {
  id: number;
  name: string;
};

export type PrintSemester = {
  id: number;
  number: number;
  title: string;
  ordinance: string;
  courses: CourseDraft[];
};

export type PrintCurriculum = {
  department: PrintDepartment;
  academicYear: PrintAcademicYear;
  semesters: PrintSemester[];
};

const topics = [
  ["Foundations", "Definitions, motivation, engineering context, notation, and representative applications."],
  ["Methods", "Core methods, implementation strategy, algorithmic trade-offs, and validation constraints."],
  ["Design", "Structured design process, modelling choices, edge cases, and documentation expectations."],
  ["Analysis", "Performance, correctness, complexity, maintainability, and professional engineering judgement."],
  ["Applications", "Laboratory or industry examples mapped to course outcomes and assessment rubrics."],
];

export const printDepartment: PrintDepartment = {
  id: 1,
  code: "COMP",
  name: "Computer Engineering",
  college_name: "Fr. Conceicao Rodrigues College of Engineering",
  university_name: "University of Mumbai",
};

export const printAcademicYear: PrintAcademicYear = {
  id: 1,
  name: "2026-27",
};

const catalog = [
  ["CSC301", "Data Structures and Algorithms", "THEORY", 3, 1, 0, 4, 40, 60],
  ["CSL301", "Data Structures Laboratory", "LAB", 0, 0, 2, 1, 50, 0],
  ["CSC302", "Database Management Systems", "THEORY", 3, 0, 0, 3, 40, 60],
  ["CSL302", "Database Systems Laboratory", "LAB", 0, 0, 2, 1, 50, 0],
  ["CSC303", "Computer Networks", "THEORY", 3, 1, 0, 4, 40, 60],
  ["CSC304", "Operating Systems", "THEORY", 3, 0, 0, 3, 40, 60],
  ["CSE305", "Professional Elective: Artificial Intelligence", "ELECTIVE", 3, 0, 0, 3, 40, 60],
  ["CSP306", "Mini Project I", "PROJECT", 0, 0, 4, 2, 50, 0],
  ["CSC401", "Design and Analysis of Algorithms", "THEORY", 3, 1, 0, 4, 40, 60],
  ["CSL401", "Algorithm Design Laboratory", "LAB", 0, 0, 2, 1, 50, 0],
  ["CSC402", "Software Engineering", "THEORY", 3, 0, 0, 3, 40, 60],
  ["CSC403", "Computer Architecture", "THEORY", 3, 1, 0, 4, 40, 60],
  ["CSE404", "Professional Elective: Cyber Security", "ELECTIVE", 3, 0, 0, 3, 40, 60],
  ["CSO405", "Open Elective: Data Visualization", "ELECTIVE", 2, 0, 2, 3, 40, 60],
  ["CSP406", "Community Innovation Project", "PROJECT", 0, 0, 4, 2, 50, 0],
] as const;

export const printCourses: CourseDraft[] = catalog.map((row, index) => {
  const [code, title, courseType, lecture, tutorial, practical, credits, internal, external] = row;
  const isLab = courseType === "LAB" || courseType === "PROJECT";
  return {
    id: index + 1,
    code,
    title,
    course_type: courseType as CourseDraft["course_type"],
    status: index % 3 === 0 ? "APPROVED" : "PUBLISHED",
    faculty_name: `Faculty Coordinator ${index + 1}`,
    last_modified: "2026-06-02 18:00",
    objectives: `${title} develops rigorous engineering competence through theory, guided practice, reflective analysis, and documented implementation evidence.`,
    pre_requisites: index % 2 === 0 ? "Engineering mathematics, programming fundamentals, and discipline-specific foundation courses." : "Nil",
    syllabus_intro: `This course is part of the autonomous Mumbai University aligned curriculum and is designed to support measurable outcomes, laboratory readiness, and professional practice.`,
    lecture_hours: lecture,
    tutorial_hours: tutorial,
    practical_hours: practical,
    lecture_credits: lecture,
    tutorial_credits: tutorial,
    practical_credits: practical ? Math.max(1, Math.ceil(practical / 2)) : 0,
    credits,
    internal_marks: internal,
    external_marks: external,
    duration_hours: external ? 3 : 2,
    outcomes: [1, 2, 3, 4, 5].map((n) => ({
      code: `CO${n}`,
      description: `${courseOutcomeVerb(n)} ${title.toLowerCase()} concepts in engineering situations with appropriate evidence, constraints, and validation criteria.`,
      bloom_level: ["Remember", "Understand", "Apply", "Analyze", "Create"][n - 1],
      order: n,
    })),
    modules: [1, 2, 3, 4, 5].map((n) => ({
      number: n,
      title: `${title} Module ${n}`,
      contact_hours: isLab ? 0 : 8 + (n % 3),
      content: `${title} module ${n} covers concepts, procedures, tools, edge cases, and assessment-linked applications.`,
      topics: topics.map(([topic, description], topicIndex) => ({
        title: `${topic} ${n}.${topicIndex + 1}`,
        description,
      })),
    })),
    experiments: [1, 2, 3, 4, 5, 6].map((n) => ({
      number: n,
      title: `${title} Experiment ${n}`,
      description: "Design, implement, test, document, and orally defend the assigned engineering task using approved rubrics.",
      hours: 2,
    })),
    assessments: [
      { component: "ISE-1", marks: Math.min(internal, 20), description: "Self-learning, quiz, or formative classroom assessment." },
      { component: "ISE-2", marks: Math.max(Math.min(internal - 20, 20), 0), description: "Application-oriented internal assessment mapped to course outcomes." },
      { component: "Laboratory Rubric", marks: isLab ? 25 : 0, description: "Continuous laboratory evaluation using predefined rubrics and viva voce." },
      { component: "End Semester Examination", marks: external, description: "Written examination based on the approved syllabus and assessment pattern." },
    ].filter((item) => item.marks > 0),
    reference_books: [
      { title: `${title}: Principles and Practice`, authors: "A. Kulkarni, M. Rao", publisher: "University Press", edition: "2nd", year: "2025", is_textbook: true },
      { title: `Advanced Topics in ${title}`, authors: "S. Mehta", publisher: "Pearson", edition: "1st", year: "2024", is_textbook: false },
      { title: `${title} Laboratory Manual`, authors: "Department Faculty Board", publisher: "Internal Publication", edition: "2026", year: "2026", is_textbook: false },
    ],
    comments: [
      { id: index * 10 + 1, section_key: "outcomes", section_label: "Course Outcomes", body: "Confirm outcome verbs are measurable and match assessment instruments.", reviewer_name: "Peer Reviewer", is_resolved: index % 2 === 0 },
      { id: index * 10 + 2, section_key: "modules", section_label: "Modules", body: "Check whether long module blocks remain intact across print page boundaries.", reviewer_name: "Peer Reviewer", is_resolved: false },
    ],
    online_resources: ["https://mu.ac.in", "https://nptel.ac.in"],
  };
});

export const printCurriculum: PrintCurriculum = {
  department: printDepartment,
  academicYear: printAcademicYear,
  semesters: [
    { id: 3, number: 3, title: "Semester III", ordinance: "R-2026-COMP-III", courses: printCourses.slice(0, 8) },
    { id: 4, number: 4, title: "Semester IV", ordinance: "R-2026-COMP-IV", courses: printCourses.slice(8) },
  ],
};

export async function getCourseForPrint(id: string): Promise<CourseDraft> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/courses/${id}/`, { cache: "no-store" });
      if (response.ok) return await response.json();
    } catch {
      // The fidelity route remains usable offline with the generated fixture.
    }
  }
  return printCourses.find((course) => String(course.id) === id || course.code === id) ?? printCourses[0];
}

export async function getCurriculumForPrint(): Promise<PrintCurriculum> {
  return printCurriculum;
}

function courseOutcomeVerb(n: number) {
  return ["Identify", "Explain", "Apply", "Analyze", "Design"][n - 1] ?? "Apply";
}
