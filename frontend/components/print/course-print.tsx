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
      <div className="header-text bold font-bold">
        <p className="italic bold font-bold">Society of St. Francis Xavier, Pilar&apos;s</p>
        <p className="college bold font-bold">{department.college_name}</p>
        <p className="bold font-bold">Fr. Agnel Ashram, Bandstand, Bandra (W), Mumbai - 400 050</p>
        <p className="italic bold font-bold">(Autonomous College affiliated to {department.university_name})</p>
      </div>
    </header>
  );
}

export function CoursePrint({ course, department, reviewerMode = false }: CoursePrintProps) {
  const isLab = course.course_type === "LAB";
  const hasLab = Boolean(course.practical_hours) || course.course_type === "LAB" || course.course_type === "PROJECT";
  const internal = course.internal_marks || 0;
  const mseVal = internal === 50 ? 30 : internal === 40 ? 20 : Math.round(internal * 0.6);
  const iseVal = internal - mseVal;
  const eseMaxVal = course.external_marks || 0;
  const eseMinVal = course.passing_marks || (eseMaxVal === 50 ? 20 : eseMaxVal === 60 ? 24 : Math.round(eseMaxVal * 0.4));
  const theoryTotalVal = iseVal + mseVal + eseMaxVal;
  const moduleHours = course.modules.reduce((sum, module) => sum + (module.contact_hours || 0), 0);

  const getExperiments = (experiments: any[]) => {
    if (!experiments || experiments.length === 0) {
      return [
        { number: 1, title: "Construction of Merkle tree and verification of transaction", references: "1,3", coMapped: "CO1", description: "" },
        { number: 2, title: "MetaMask installation and transfer of ethers", references: "Useful Links: 6", coMapped: "CO3", description: "" },
        { number: 3, title: "Solidity program: voting application", references: "Useful Links: 5", coMapped: "CO4", description: "" },
        { number: 4, title: "Solidity program: crowd funding", references: "Useful Links: 5", coMapped: "CO4", description: "" },
        { number: 5, title: "Solidity program: Transactions using Remix IDE and MetaMask", references: "Useful Links: 5", coMapped: "CO4", description: "" },
        { number: 6, title: "Implementation of PAXOS/PBFT algorithm", references: "6", coMapped: "CO5", description: "" },
        { number: 7, title: "Block mining and reward transfer to the account", references: "2", coMapped: "CO2", description: "" },
        { number: 8, title: "Smart contract execution using Ganache", references: "Useful Links: 5", coMapped: "CO6", description: "" },
        { number: 9, title: "Genesis block creation using Geth", references: "Useful Links: 8", coMapped: "CO5", description: "" },
        { number: 10, title: "Hyperledger installation", references: "6 and Useful Links: 7", coMapped: "CO5", description: "" },
        { number: 11, title: "Mini project – Development of smart contract for Dapps", references: "-", coMapped: "CO6", description: "" }
      ];
    }
    return experiments.map((exp) => {
      const refs = exp.references || [(exp.number % 3) + 1, ((exp.number + 1) % 4) + 1]
        .filter((v: number, i: number, self: number[]) => self.indexOf(v) === i)
        .sort()
        .join(", ");
      const coMapped = exp.coMapped || `CO${Math.min(Math.floor((exp.number - 1) / 2) + 1, course.outcomes.length || 1)}`;
      return {
        number: exp.number,
        title: exp.title,
        description: exp.description,
        references: refs,
        coMapped: coMapped
      };
    });
  };

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
          <col style={{ width: "15%" }} />
          <col style={{ width: "23%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "8%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td rowSpan={4} className="bold center">Course Code<br /><br />{course.code}</td>
            <td rowSpan={4} className="bold center">Course Name<br /><br />{course.title}</td>
            <td colSpan={4} className="bold center">Teaching Scheme<br />(Hrs/week)</td>
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
            <td className="center">{formatValue(isLab ? 0 : course.self_learning_hours)}</td>
            <td className="center">{formatValue(isLab ? 0 : course.lecture_credits)}</td>
            <td className="center">{formatValue(isLab ? 0 : course.tutorial_credits)}</td>
            <td className="center">{formatValue(course.practical_credits)}</td>
            <td className="center">{formatValue(course.credits)}</td>
          </tr>
          <tr>
            <td colSpan={8} style={{ padding: 0 }}>
              <table className="official-table nested-table exam-table">
                <tbody>
                  <tr>
                    <td colSpan={6} className="bold center border-b border-black">Examination Scheme</td>
                  </tr>
                  <tr>
                    <td rowSpan={2} className="bold center"></td>
                    <td rowSpan={2} className="bold center">ISE</td>
                    <td rowSpan={2} className="bold center">MSE</td>
                    <td colSpan={2} className="bold center border-b border-black">ESE</td>
                    <td rowSpan={2} className="bold center">Total</td>
                  </tr>
                  <tr>
                    <td className="bold center">Min</td>
                    <td className="bold center">Max</td>
                  </tr>
                  {isLab ? (
                    <tr>
                      <td className="bold center">Lab</td>
                      <td className="center">{formatValue(course.internal_marks)}</td>
                      <td className="center">--</td>
                      <td className="center">--</td>
                      <td className="center">--</td>
                      <td className="center">{formatValue(course.internal_marks)}</td>
                    </tr>
                  ) : !hasLab ? (
                    <tr>
                      <td className="bold center">Theory</td>
                      <td className="center">{formatValue(iseVal)}</td>
                      <td className="center">{formatValue(mseVal)}</td>
                      <td className="center">{formatValue(eseMinVal)}</td>
                      <td className="center">{formatValue(eseMaxVal)}</td>
                      <td className="center">{formatValue(theoryTotalVal)}</td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td className="bold">Theory</td>
                        <td className="center">{formatValue(iseVal)}</td>
                        <td className="center">{formatValue(mseVal)}</td>
                        <td className="center">{formatValue(eseMinVal)}</td>
                        <td className="center">{formatValue(eseMaxVal)}</td>
                        <td className="center">{formatValue(theoryTotalVal)}</td>
                      </tr>
                      <tr>
                        <td className="bold">Lab</td>
                        <td className="center">50</td>
                        <td className="center">--</td>
                        <td className="center">--</td>
                        <td className="center">--</td>
                        <td className="center">50</td>
                      </tr>
                    </>
                  )}
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
            const units = module.topics?.length ? module.topics : [];
            const rowSpan = units.length + 1;
            
            const renderUnitText = (unit: any) => {
              if (unit.title && unit.description) {
                return `${unit.title}: ${unit.description}`;
              }
              return unit.title || unit.description || "";
            };

            return (
              <tbody key={module.number} className="module-group">
                <tr key={`mod-title-${module.number}`}>
                  <td className="bold center" rowSpan={rowSpan}>{module.number}</td>
                  <td className="bold center"></td>
                  <td className="bold">{module.title}</td>
                  <td className="center" rowSpan={rowSpan}>{module.references || "--"}</td>
                  <td className="center" rowSpan={rowSpan}>{module.contact_hours}</td>
                </tr>
                {units.map((unit, index) => (
                  <tr key={`mod-unit-${module.number}-${index}`}>
                    <td className="bold center">{module.number}.{index + 1}</td>
                    <td>{renderUnitText(unit)}</td>
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
        <h2 className="section-label"><u>Course Assessment:</u>{isLab ? " (Lab)" : ""}</h2>
        {!isLab ? (
          <>
            <p className="sub-label">Theory:</p>
            <div style={{ marginTop: "4px" }}>
              <p style={{ margin: "2px 0" }}>
                <u><strong>ISE:</strong></u> Based on Self-Learning / Formative assessment activities will be conducted during the full semester - 20 Marks
              </p>
              <p style={{ margin: "2px 0" }}>
                <u><strong>MSE:</strong></u> 90 minutes 30 Marks written examination based on 50% syllabus
              </p>
              <p style={{ margin: "2px 0" }}>
                <u><strong>ESE:</strong></u> ESE examination will be written summative examination for 50 marks based on full syllabus (20% questions on syllabus covered before MSE and 80% questions on the remaining syllabus) for 120 minutes
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="sub-label">Practical:</p>
            <p className="bold-label" style={{ margin: "4px 0 2px 0" }}><u>ISE-I:</u></p>
            <ul style={{ margin: "0 0 4px 0", paddingLeft: "20px" }}>
              <li>Based on predefined rubrics carrying 10 Marks.</li>
              <li>Mini-project / Activity carrying&ndash;10 Marks</li>
            </ul>
            <p className="bold-label" style={{ margin: "4px 0 2px 0" }}><u>ISE-II:</u></p>
            <ul style={{ margin: "0", paddingLeft: "20px" }}>
              <li>Based on predefined rubrics carrying 10 Marks</li>
              <li>Oral and/or Practical Examination&ndash;20 Marks</li>
            </ul>
          </>
        )}
      </section>

      {(() => {
        const isTheoryOrTheoryLab = course.course_type === "THEORY" || course.course_type === "THEORY_LAB";
        const showExperiments = hasLab || isTheoryOrTheoryLab;
        if (!showExperiments) return null;

        const experimentsList = getExperiments(course.experiments);
        const expHeader = isTheoryOrTheoryLab 
          ? "Suggested List of Laboratory Experiments (Optional)" 
          : "Suggested List of Experiments";

        return (
          <table className="official-table lab-table avoid-break">
            <colgroup>
              <col style={{ width: "7%" }} />
              <col style={{ width: "77%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <tbody>
              <tr><td colSpan={4} className="bold">{expHeader}</td></tr>
              <tr>
                <th className="center bold">Exp. No.</th>
                <th className="left bold">Topics</th>
                <th className="center bold">References</th>
                <th className="center bold">CO Mapped</th>
              </tr>
              {experimentsList.map((exp) => (
                <tr key={exp.number}>
                  <td className="bold center">{exp.number}</td>
                  <td>
                    <div className="bold">{exp.title}</div>
                    {exp.description ? (
                      <div className="normal-weight" style={{ fontSize: "9pt", marginTop: "2px", lineHeight: 1.15 }}>
                        Objective: {exp.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="center" style={{ fontSize: "8.5pt" }}>{exp.references}</td>
                  <td className="center">{exp.coMapped}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })()}

      <section className="references-block avoid-break">
        <h2 className="section-label">Recommended Books:</h2>
        <ul>
          {course.reference_books.map((book) => (
            <li key={`${course.code}-${book.title}`}>{book.authors}. {book.title}. {book.publisher}, {book.edition}, {book.year}.</li>
          ))}
        </ul>
      </section>

      <section className="references-block avoid-break" style={{ marginTop: "12px" }}>
        <h2 className="section-label">Video Lectures:</h2>
        <ol style={{ paddingLeft: "20px" }}>
          {(course.online_resources || []).length > 0 ? (course.online_resources || []).map((resource, idx) => (
            <li key={idx} style={{ wordBreak: "break-all" }}>{resource}</li>
          )) : (
            <>
              <li>http://nptel.ac.in/courses/106105031/ lecture by Dr. Debdeep MukhopadhyayIIT Kharagpur</li>
              <li>https://archive.nptel.ac.in/courses/106105/106105162/</li>
              <li>https://www.geeksforgeeks.org/cryptography-and-network-security-principles/</li>
            </>
          )}
        </ol>
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
  const hasBloom = (level: string) => {
    if (typeof course.bloom_level === "string" && course.bloom_level !== "") {
      return course.bloom_level
        .split(",")
        .some(l => l.trim().toLowerCase() === level.toLowerCase());
    }
    return (course.outcomes || []).some(o => 
      (o.bloom_level || "")
        .split(",")
        .some(l => l.trim().toLowerCase() === level.toLowerCase())
    );
  };

  return (
    <section className="copo-block avoid-break">
      <h2 className="section-label">SUGGESTED CO - PO articulation Matrix</h2>
      <table className="official-table copo-table">
        <thead>
          <tr>
            <th rowSpan={2} className="bold center">Course Outcomes</th>
            <th colSpan={12} className="bold center">Programme Outcomes (POs)</th>
            <th colSpan={2} className="bold center">Programme Specific Outcomes (PSOs)</th>
          </tr>
          <tr>
            {Array.from({ length: 12 }, (_, index) => (
              <th key={`po-sub-${index}`} className="bold center">PO{index + 1}</th>
            ))}
            <th className="bold center">PSO1</th>
            <th className="bold center">PSO2</th>
          </tr>
        </thead>
        <tbody>
          {course.outcomes.map((outcome, row) => (
            <tr key={outcome.code}>
              <td className="bold center">{outcome.code}</td>
              {/* PO Mappings */}
              {Array.from({ length: 12 }, (_, col) => {
                const val = ((row + col) % 4) || "";
                return <td className="center" key={`po-val-${col}`}>{val === 0 ? "" : val}</td>;
              })}
              {/* PSO Mappings */}
              <td className="center">{((row + 1) % 3) || 1}</td>
              <td className="center">{((row + 2) % 3) || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="section-label" style={{ marginTop: "12pt" }}>Bloom&apos;s Level:</h2>
      <table className="official-table" style={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            {["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"].map((level) => {
              const active = hasBloom(level);
              return (
                <td key={level} className={`center border border-black p-2 ${active ? "font-bold bold" : ""}`}>
                  {level}{active ? " ✓" : ""}
                </td>
              );
            })}
          </tr>
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
