import { CurriculumPrint } from "@/components/print/curriculum-print";
import { getCurriculumForPrint } from "@/lib/print-fixture";

const COMPS_PREVIOUS_SUBJECTS = [
  { code: "25BSC12CE05", title: "Discrete Mathematics and Graph Theory", course_type: "THEORY", credits: 2, semester: 3 },
  { code: "25PCC12CE05", title: "Computer Organization and Architecture", course_type: "THEORY_LAB", credits: 3, semester: 3 },
  { code: "25PCC12CE06", title: "Data Structures", course_type: "THEORY_LAB", credits: 4, semester: 3 },
  { code: "25PCC12CE07", title: "Object Oriented Programming with JAVA", course_type: "LAB", credits: 1, semester: 3 },
  { code: "25OE13CE11", title: "Law for Engineers", course_type: "THEORY", credits: 2, semester: 3 },
  { code: "25OE13CE12", title: "Financial Planning, Taxation and Investment", course_type: "THEORY", credits: 2, semester: 3 },
  { code: "25VEC12CE01", title: "Human Values and Professional Ethics", course_type: "THEORY", credits: 2, semester: 3 },
  { code: "25CEP12CE01", title: "Community Engagement Project", course_type: "PROJECT", credits: 2, semester: 3 },
  { code: "25BSC12CE06", title: "Linear Algebra and Business Statistics", course_type: "THEORY", credits: 2, semester: 4 },
  { code: "25PCC12CE08", title: "Database Management Systems", course_type: "THEORY_LAB", credits: 3, semester: 4 },
  { code: "25PCC12CE09", title: "Analysis of Algorithm", course_type: "THEORY_LAB", credits: 4, semester: 4 },
  { code: "25PCC12CE010", title: "Operating Systems", course_type: "THEORY_LAB", credits: 3, semester: 4 },
  { code: "25OE13CE21", title: "Emerging Technology and Law", course_type: "THEORY", credits: 2, semester: 4 },
  { code: "25OE13CE22", title: "Principles of Management", course_type: "THEORY", credits: 2, semester: 4 },
  { code: "25VSE12CE03", title: "Full Stack Development", course_type: "LAB", credits: 2, semester: 4 },
  { code: "25EEM12CE02", title: "Technology Entrepreneurship", course_type: "THEORY", credits: 2, semester: 4 },
  { code: "25VEC12CE02", title: "Technology Innovation for Sustainable Development", course_type: "THEORY", credits: 2, semester: 4 },
  { code: "25PCC13CE11", title: "Cryptography and System Security", course_type: "THEORY_LAB", credits: 3, semester: 5 },
  { code: "25PCC13CE12", title: "Theory of Computer Science", course_type: "THEORY_LAB", credits: 3, semester: 5 },
  { code: "25PCC13CE13", title: "System Programming and Compiler construction", course_type: "THEORY_LAB", credits: 3, semester: 5 },
  { code: "25PCC13CE14", title: "Data Warehousing and Mining", course_type: "THEORY_LAB", credits: 3, semester: 5 },
  { code: "25VSE13CE04", title: "Cloud Computing Lab", course_type: "LAB", credits: 2, semester: 5 },
  { code: "25PCC13CE15", title: "Distributed Computing", course_type: "THEORY_LAB", credits: 3, semester: 6 },
  { code: "25PCC13CE16", title: "Software Engineering", course_type: "THEORY_LAB", credits: 3, semester: 6 },
  { code: "25PCC13CE17", title: "Artificial Intelligence Lab", course_type: "LAB", credits: 1, semester: 6 },
  { code: "25PCC13CE18", title: "Mini Project", course_type: "PROJECT", credits: 1, semester: 6 },
  { code: "25PCC13CE19", title: "Mobile App development", course_type: "LAB", credits: 1, semester: 6 },
  { code: "25PCC13CE20", title: "DevOps Lab", course_type: "LAB", credits: 1, semester: 6 },
  { code: "25PCC13CE21", title: "Advanced Microprocessors", course_type: "THEORY_LAB", credits: 3, semester: 6 }
];

export default async function FinalCurriculumPrintPage({ searchParams }: { searchParams: Promise<{ version?: string, department?: string }> }) {
  const { version = "fidelity-validation", department } = await searchParams;
  const curriculum = await getCurriculumForPrint();
  
  let previousSubjects: any[] = [];
  // CE is department ID 1 in our DB
  if (department === "1" || department === "CE") {
    previousSubjects = COMPS_PREVIOUS_SUBJECTS;
  }

  return <CurriculumPrint curriculum={curriculum} version={version} previousSubjects={previousSubjects} />;
}
