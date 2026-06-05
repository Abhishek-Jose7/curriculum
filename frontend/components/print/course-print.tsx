import Image from "next/image";
import type { CourseDraft } from "@/types/curriculum";
import type { PrintAcademicYear, PrintDepartment, PrintSemester } from "@/lib/print-fixture";

type CoursePrintProps = {
  course: CourseDraft;
  department: PrintDepartment;
  academicYear: PrintAcademicYear;
  reviewerMode?: boolean;
};

export function InstitutionalHeader({ department }: { department: PrintDepartment }) {
  return (
    <header className="print-running-header institutional-header">
      <div className="header-logo">
        <Image src="/logo.jpeg" alt="Institutional Logo" width={72} height={72} priority />
      </div>
      <div className="header-text">
        <p className="italic">Society of St. Francis Xavier, Pilar&apos;s</p>
        <p className="college">{department.college_name}</p>
        <p>Fr. Agnel Ashram, Bandstand, Bandra (W), Mumbai - 400 050</p>
        <p className="italic">(Autonomous College affiliated to {department.university_name})</p>
      </div>
    </header>
  );
}

export function CoursePrint({ course, department, reviewerMode = false }: CoursePrintProps) {
  const isLab = course.course_type === "LAB";
  const hasLab = Boolean(course.practical_hours) || course.course_type === "LAB" || course.course_type === "PROJECT";
  const ise1 = Math.min(course.internal_marks || 0, 20);
  const ise2 = Math.max(Math.min((course.internal_marks || 0) - ise1, 20), 0);
  const moduleHours = course.modules.reduce((sum, module) => sum + (module.contact_hours || 0), 0);

  return (
    <article className="course-section page">
      <InstitutionalHeader department={department} />
      <h1 className="doc-title">Course Content{hasLab && !isLab ? " (includes Practical)" : isLab ? " (Practical Only)" : ""}</h1>

      {reviewerMode ? (
        <section className="review-banner avoid-break">
          <h2>Reviewer Read-Only Curriculum View</h2>
          <p>Reviewers comment on selected sections only. The official admin/faculty publishing template is not editable here.</p>
        </section>
      ) : null}

      <table className="official-table course-identity">
        <colgroup>
          <col style={{ width: "13%" }} />
          <col style={{ width: "17%" }} />
          <col span={8} style={{ width: "8.75%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td rowSpan={4} className="bold center">Course Code<br /><br />{course.code}</td>
            <td rowSpan={4} className="bold center">Course Name<br /><br />{course.title}</td>
            <td colSpan={4} className="bold center">Teaching Scheme (Hrs/week)</td>
            <td colSpan={4} className="bold center">Credits Assigned</td>
          </tr>
          <tr>
            <td className="bold center">L</td>
            <td className="bold center">T</td>
            <td className="bold center">P</td>
            <td className="bold center">SL</td>
            <td className="bold center">L</td>
            <td className="bold center">T</td>
            <td className="bold center">P</td>
            <td className="bold center">Total</td>
          </tr>
          <tr>
            <td className="center">{formatValue(isLab ? 0 : course.lecture_hours)}</td>
            <td className="center">{formatValue(isLab ? 0 : course.tutorial_hours)}</td>
            <td className="center">{formatValue(course.practical_hours)}</td>
            <td className="center">--</td>
            <td className="center">{formatValue(isLab ? 0 : course.lecture_credits)}</td>
            <td className="center">{formatValue(isLab ? 0 : course.tutorial_credits)}</td>
            <td className="center">{formatValue(course.practical_credits)}</td>
            <td className="center">{formatValue(course.credits)}</td>
          </tr>
          <tr>
            <td colSpan={8} className="nested-cell">
              <table className="official-table nested-table exam-table">
                <tbody>
                  <tr><td colSpan={7} className="bold center">Examination Scheme</td></tr>
                  <tr>
                    <td></td>
                    <td className="bold center">ISE1</td>
                    <td className="bold center">MSE</td>
                    <td className="bold center">ISE2</td>
                    <td className="bold center">ESE</td>
                    <td className="bold center">Total</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Theory</td>
                    <td className="center">{!isLab ? formatValue(ise1) : "--"}</td>
                    <td className="center">--</td>
                    <td className="center">{!isLab ? formatValue(ise2) : "--"}</td>
                    <td className="center">{!isLab ? formatValue(course.external_marks) : "--"}</td>
                    <td className="center">{!isLab ? formatValue(course.internal_marks + course.external_marks) : "--"}</td>
                    <td></td>
                  </tr>
                  {hasLab ? (
                    <tr>
                      <td>Lab</td>
                      <td className="center">25</td>
                      <td className="center">--</td>
                      <td className="center">25</td>
                      <td className="center">--</td>
                      <td className="center">50</td>
                      <td></td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="official-table avoid-break">
        <colgroup>
          <col style={{ width: "18%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "72%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={2} className="bold">Pre-requisite Course Codes</td>
            <td>{course.pre_requisites || "--"}</td>
          </tr>
          <tr><td colSpan={3}>After the successful completion students should be able to:</td></tr>
          {course.outcomes.map((outcome, index) => (
            <tr key={outcome.code}>
              {index === 0 ? <td className="bold" rowSpan={course.outcomes.length}>Course Outcomes</td> : null}
              <td className="bold center">{outcome.code}</td>
              <td>{outcome.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!isLab ? (
        <table className="official-table module-table">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "67%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Module No.</th>
              <th>Unit No.</th>
              <th className="left">Topics</th>
              <th>Ref.</th>
              <th>Hrs.</th>
            </tr>
          </thead>
          {course.modules.map((module) => {
            const units = module.topics?.length ? module.topics : [{ title: module.title, description: module.content }];
            return (
              <tbody key={module.number} className="module-group">
                {units.map((unit, index) => (
                  <tr key={`${module.number}-${index}`}>
                    {index === 0 ? <td className="bold center" rowSpan={units.length}>{module.number}</td> : null}
                    <td className="bold center">{module.number}.{index + 1}</td>
                    <td>{unit.title}: {unit.description}</td>
                    <td className="center">--</td>
                    {index === 0 ? <td className="center" rowSpan={units.length}>{module.contact_hours}</td> : null}
                  </tr>
                ))}
              </tbody>
            );
          })}
          <tfoot>
            <tr>
              <td colSpan={3} className="bold">Total</td>
              <td colSpan={2} className="bold center">{moduleHours}</td>
            </tr>
          </tfoot>
        </table>
      ) : null}

      <section className="assessment-block avoid-break">
        <h2 className="section-label">Course Assessment:{isLab ? " (Lab)" : ""}</h2>
        {!isLab ? <p className="sub-label">Theory:</p> : null}
        <ol>
          {course.assessments.map((item, index) => (
            <li key={`${item.component}-${index}`}><strong>{item.component} ({item.marks} marks):</strong> {item.description}</li>
          ))}
        </ol>
      </section>

      {hasLab ? (
        <table className="official-table lab-table avoid-break">
          <colgroup>
            {isLab ? (
              <>
                <col style={{ width: "7%" }} />
                <col style={{ width: "78%" }} />
                <col style={{ width: "7.5%" }} />
                <col style={{ width: "7.5%" }} />
              </>
            ) : (
              <>
                <col style={{ width: "6%" }} />
                <col style={{ width: "78%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
              </>
            )}
          </colgroup>
          <tbody>
            <tr><td colSpan={4} className="bold">To be Taught in laboratory</td></tr>
            <tr>
              <th>&nbsp;</th>
              <th className="left">{isLab ? "Topics wise List of Experiments with relevant topic" : "Topics"}</th>
              <th>Ref.</th>
              <th>COs</th>
            </tr>
            {course.experiments.map((experiment) => (
              <tr key={experiment.number}>
                <td className="bold center">{experiment.number}</td>
                <td>{experiment.title}: {experiment.description}</td>
                <td className="center">--</td>
                <td className="center">--</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <section className="references-block avoid-break">
        <h2 className="section-label">Recommended Books:</h2>
        <ul>
          {course.reference_books.map((book) => (
            <li key={`${course.code}-${book.title}`}>{book.authors}. {book.title}. {book.publisher}, {book.edition}, {book.year}.</li>
          ))}
        </ul>
      </section>

      <CoPoMatrix course={course} />

      {reviewerMode ? <ReviewerComments course={course} /> : null}
    </article>
  );
}

export function SemesterStructure({ semester }: { semester: PrintSemester }) {
  const total = semester.courses.reduce((acc, course) => ({
    lecture: acc.lecture + course.lecture_hours,
    tutorial: acc.tutorial + course.tutorial_hours,
    practical: acc.practical + course.practical_hours,
    credits: acc.credits + Number(course.credits),
    marks: acc.marks + course.internal_marks + course.external_marks + (course.practical_hours ? 50 : 0),
  }), { lecture: 0, tutorial: 0, practical: 0, credits: 0, marks: 0 });

  return (
    <section className="semester-structure page">
      <h1 className="semester-title">SEMESTERWISE CURRICULUM STRUCTURE</h1>
      <h2 className="semester-subtitle">Computer Engineering Program: Semester {semester.number}</h2>
      <table className="official-table multi-level-table">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "25%" }} />
          <col span={3} style={{ width: "3%" }} />
          <col span={4} style={{ width: "4%" }} />
          <col span={6} style={{ width: "5%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={3}>Course Code</th>
            <th rowSpan={3}>Course Name</th>
            <th colSpan={3}>Teaching Scheme<br />(Contact Hours/Week)</th>
            <th colSpan={4}>Credits Assigned</th>
            <th colSpan={7}>Examination Scheme</th>
          </tr>
          <tr>
            <th rowSpan={2}>L</th>
            <th rowSpan={2}>T</th>
            <th rowSpan={2}>P</th>
            <th rowSpan={2}>L</th>
            <th rowSpan={2}>T</th>
            <th rowSpan={2}>P</th>
            <th rowSpan={2}>Total</th>
            <th colSpan={4}>Theory Courses</th>
            <th colSpan={2}>Practical / Lab</th>
            <th rowSpan={2}>Total Marks</th>
          </tr>
          <tr>
            <th>ISE 1</th>
            <th>ISE 2</th>
            <th>MSE</th>
            <th>ESE</th>
            <th>ISE 1</th>
            <th>ISE 2</th>
          </tr>
        </thead>
        <tbody>
          {semester.courses.map((course) => (
            <tr key={course.code}>
              <td className="center monospace">{course.code}</td>
              <td className={`bold ${course.title.length > 25 ? "font-condensed" : ""}`}>{course.title}</td>
              <td className="center">{course.lecture_hours}</td>
              <td className="center">{course.tutorial_hours}</td>
              <td className="center">{course.practical_hours}</td>
              <td className="center">{course.lecture_credits}</td>
              <td className="center">{course.tutorial_credits}</td>
              <td className="center">{course.practical_credits}</td>
              <td className="center bold">{course.credits}</td>
              <td className="center">{Math.min(course.internal_marks, 20) || "-"}</td>
              <td className="center">{Math.max(Math.min(course.internal_marks - 20, 20), 0) || "-"}</td>
              <td className="center">-</td>
              <td className="center">{course.external_marks || "-"}</td>
              <td className="center">{course.practical_hours ? 25 : "-"}</td>
              <td className="center">{course.practical_hours ? 25 : "-"}</td>
              <td className="center bold">{course.internal_marks + course.external_marks + (course.practical_hours ? 50 : 0)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="center bold">Total</td>
            <td className="center">{total.lecture}</td>
            <td className="center">{total.tutorial}</td>
            <td className="center">{total.practical}</td>
            <td colSpan={4} className="center bold">{total.credits}</td>
            <td colSpan={6} className="center">-</td>
            <td className="center bold">{total.marks}</td>
          </tr>
        </tfoot>
      </table>
      <p className="footnote"><strong>Abbreviations:</strong> L: Lecture; T: Tutorial; P: Practical/Lab; ISE: In-Semester Evaluation; MSE: Mid-Semester Examination; ESE: End Semester Examination.</p>
      <p className="footnote"><strong>Regulatory Ordinance Code:</strong> {semester.ordinance}</p>
    </section>
  );
}

function CoPoMatrix({ course }: { course: CourseDraft }) {
  return (
    <section className="copo-block avoid-break">
      <h2 className="section-label">CO-PO Mapping Matrix</h2>
      <table className="official-table copo-table">
        <thead>
          <tr>
            <th>CO</th>
            {Array.from({ length: 12 }, (_, index) => <th key={index}>PO{index + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {course.outcomes.map((outcome, row) => (
            <tr key={outcome.code}>
              <td className="bold center">{outcome.code}</td>
              {Array.from({ length: 12 }, (_, col) => <td className="center" key={col}>{((row + col) % 4) || ""}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ReviewerComments({ course }: { course: CourseDraft }) {
  return (
    <section className="reviewer-comments page-break-before">
      <h2 className="section-label">Reviewer Comments</h2>
      <table className="official-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Comment</th>
            <th>Reviewer</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {course.comments.map((comment) => (
            <tr key={comment.id}>
              <td>{comment.section_label}</td>
              <td>{comment.body}</td>
              <td>{comment.reviewer_name}</td>
              <td className="center">{comment.is_resolved ? "Resolved" : "Open"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function formatValue(value: number | string | undefined | null) {
  if (value === 0 || value === "0" || value === undefined || value === null || value === "") return "--";
  return value;
}
