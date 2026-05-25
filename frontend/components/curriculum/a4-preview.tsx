"use client";

import type { CourseDraft } from "@/types/curriculum";
import { cn } from "@/lib/utils";

type Props = {
  course: CourseDraft;
  selectedSection?: string;
  onSelectSection?: (section: string) => void;
  reviewMode?: boolean;
};

export function A4Preview({ course, selectedSection, onSelectSection, reviewMode = false }: Props) {
  const isLab = course.course_type === "LAB";
  const hasLab = (course.practical_hours || 0) > 0 || isLab;
  
  const totalMarks = (course.internal_marks || 0) + (course.external_marks || 0);
  const ise1 = Math.min(course.internal_marks || 0, 20);
  const ise2 = Math.max(Math.min((course.internal_marks || 0) - ise1, 20), 0);
  const formatValue = (val: number | string | undefined | null) => {
    if (val === 0 || val === "0" || !val) return "--";
    return val;
  };

  const totalModuleHours = course.modules.reduce((sum, module) => sum + (module.contact_hours || 0), 0);

  return (
    <div className="h-full overflow-auto bg-zinc-200 p-4 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4">
        <div className="relative w-full bg-white px-[45px] pb-[68px] pt-[57px] text-black shadow-lg" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '10pt', lineHeight: '1.2' }}>
          
          <header className="mb-2 flex w-full items-center border-b-[1.5pt] border-black pb-[5pt]">
            <div className="pr-[5pt] w-[21mm]">
              <img src="/logo.jpeg" alt="Institutional Logo" className="h-[19mm] w-[19mm] object-contain block" />
            </div>
            <div className="text-center flex-1" style={{ lineHeight: 1.38 }}>
              <p className="m-0 text-[8.5pt] italic">Society of St.&nbsp;Francis Xavier, Pilar&rsquo;s</p>
              <p className="m-0 text-[11pt] font-bold">Fr. Conceicao Rodrigues College of Engineering</p>
              <p className="m-0 text-[8.5pt]">Fr. Agnel Ashram, Bandstand, Bandra (W), Mumbai &ndash; 400&nbsp;050</p>
              <p className="m-0 text-[8pt] italic">(Autonomous College affiliated to University of Mumbai)</p>
            </div>
          </header>
          
          <div className="text-center font-bold underline mt-[5pt] mb-[7pt] text-[11pt]" style={{ letterSpacing: '0.015em' }}>
            Course Content{hasLab && !isLab ? " (includes Practical's)" : isLab ? " (Practical Only)" : ""}
          </div>

          <main>
          {reviewMode && (
            <div className="mb-2 border-[0.5pt] border-black p-2 text-[8.5pt]">
              <h4 className="m-0 mb-1 font-bold text-[11pt]">Reviewer Read-Only Curriculum View</h4>
              <p className="m-0">Reviewers comment on selected sections only. The official admin/faculty publishing template is not editable here.</p>
            </div>
          )}

          <Selectable id="basic" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <table className="preview-table">
              <colgroup>
                <col style={{ width: "13%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "8.75%" }} />
                <col style={{ width: "8.75%" }} />
                <col style={{ width: "8.75%" }} />
                <col style={{ width: "8.75%" }} />
                <col style={{ width: "8.75%" }} />
                <col style={{ width: "8.75%" }} />
                <col style={{ width: "8.75%" }} />
                <col style={{ width: "8.75%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td rowSpan={4} className="font-bold text-center">Course Code<br /><br />{course.code}</td>
                  <td rowSpan={4} className="font-bold text-center">Course Name<br /><br /><span className="font-bold">{course.title}</span></td>
                  <td colSpan={4} className="font-bold text-center">Teaching Scheme (Hrs/week)</td>
                  <td colSpan={4} className="font-bold text-center">Credits Assigned</td>
                </tr>
                <tr>
                  <td className="font-bold text-center">L</td><td className="font-bold text-center">T</td>
                  <td className="font-bold text-center">P</td><td className="font-bold text-center">SL</td>
                  <td className="font-bold text-center">L</td><td className="font-bold text-center">T</td>
                  <td className="font-bold text-center">P</td><td className="font-bold text-center">Total</td>
                </tr>
                <tr>
                  <td className="text-center">{!isLab ? formatValue(course.lecture_hours) : "--"}</td>
                  <td className="text-center">{!isLab ? formatValue(course.tutorial_hours) : "--"}</td>
                  <td className="text-center">{formatValue(course.practical_hours)}</td>
                  <td className="text-center">--</td>
                  <td className="text-center">{!isLab ? formatValue(course.lecture_hours) : "--"}</td>
                  <td className="text-center">{!isLab ? formatValue(course.tutorial_hours) : "--"}</td>
                  <td className="text-center">{formatValue(course.practical_hours ? Math.ceil(course.practical_hours / 2) : 0)}</td>
                  <td className="text-center">{formatValue(course.credits)}</td>
                </tr>
                <tr>
                  <td colSpan={8} style={{ padding: 0, border: 0 }}>
                    <Selectable id="examination" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
                      <table className="w-full border-collapse m-0 exam-tbl" style={{ tableLayout: "fixed", fontSize: "9pt", lineHeight: 1.1 }}>
                        <colgroup>
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "12%" }} />
                        </colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={7} className="font-bold text-center border-b-[1pt] border-black pb-[2pt]">Examination Scheme</td>
                          </tr>
                          <tr>
                            <td style={{ borderTop: "0.75pt solid #000" }}></td>
                            <td className="col-hdr">ISE1</td>
                            <td className="col-hdr">MSE</td>
                            <td className="col-hdr">ISE2</td>
                            <td className="col-hdr">ESE</td>
                            <td className="col-hdr">Total</td>
                            <td style={{ borderTop: "0.75pt solid #000" }}></td>
                          </tr>
                          <tr>
                            <td>Theory</td>
                            <td className="text-center">{!isLab ? formatValue(ise1) : "--"}</td>
                            <td className="text-center">{!isLab ? "--" : "--"}</td>
                            <td className="text-center">{!isLab ? formatValue(ise2) : "--"}</td>
                            <td className="text-center">{!isLab ? formatValue(course.external_marks) : "--"}</td>
                            <td className="text-center">{!isLab ? formatValue(totalMarks) : "--"}</td>
                            <td></td>
                          </tr>
                          {hasLab && (
                            <tr>
                              <td>Lab</td>
                              <td className="text-center">25</td>
                              <td className="text-center">--</td>
                              <td className="text-center">25</td>
                              <td className="text-center">--</td>
                              <td className="text-center">50</td>
                              <td></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </Selectable>
                  </td>
                </tr>
              </tbody>
            </table>
          </Selectable>

          <Selectable id="outcomes" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <table className="preview-table">
              <colgroup><col style={{ width: "28%" }} /><col style={{ width: "72%" }} /></colgroup>
              <tbody>
                <tr>
                  <td className="font-bold">Pre-requisite Course Codes</td>
                  <td>{course.pre_requisites || "--"}</td>
                </tr>
                <tr><td colSpan={2}>After the successful completion students should be able to:</td></tr>
                {course.outcomes.map((outcome, idx) => (
                  <tr key={outcome.code}>
                    {idx === 0 && <td className="font-bold" rowSpan={course.outcomes.length || 1}>Course Outcomes</td>}
                    <td><span className="font-bold">{outcome.code}</span>&ensp;{outcome.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Selectable>

          {!isLab && (
            <Selectable id="modules" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
              <table className="preview-table">
                <colgroup>
                  <col style={{ width: "10%" }} /><col style={{ width: "9%" }} />
                  <col style={{ width: "67%" }} /><col style={{ width: "7%" }} /><col style={{ width: "7%" }} />
                </colgroup>
                <tbody>
                  <tr>
                    <th className="text-center font-bold">Module No.</th><th className="text-center font-bold">Unit No.</th>
                    <th style={{ textAlign: "left" }} className="font-bold">Topics</th>
                    <th className="text-center font-bold">Ref.</th><th className="text-center font-bold">Hrs.</th>
                  </tr>
                  {course.modules.flatMap((module) => {
                    const units = module.topics?.length ? module.topics : [{ title: module.title, description: module.content }];
                    return units.map((unit, index) => (
                      <tr key={`${module.number}-${index}`}>
                        {index === 0 && <td className="font-bold text-center" rowSpan={units.length}>{module.number}</td>}
                        <td className="font-bold text-center">{module.number}.{index + 1}</td>
                        <td>{unit.title}: {unit.description}</td>
                        <td className="text-center">--</td>
                        {index === 0 && <td className="text-center" rowSpan={units.length}>{module.contact_hours}</td>}
                      </tr>
                    ));
                  })}
                  <tr>
                    <td colSpan={3} className="font-bold">Total</td>
                    <td colSpan={2} className="font-bold text-center">{totalModuleHours}</td>
                  </tr>
                </tbody>
              </table>
            </Selectable>
          )}

          <Selectable id="assessments" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <div className="mb-2">
              <p className="font-bold mt-[5pt] mb-[2.5pt] text-[10pt]" style={{ lineHeight: 1.15 }}>Course Assessment:{isLab ? " \u2013 (Lab)" : ""}</p>
              {!isLab && <p className="font-bold m-0">Theory:</p>}
              {course.assessments?.length > 0 ? (
                <ol className="m-0 pl-5">
                  {course.assessments.map((a, i) => (
                    <li key={i}><strong>{a.component} ({a.marks} marks):</strong> {a.description}</li>
                  ))}
                </ol>
              ) : !isLab ? (
                <>
                  <p className="m-0"><b>ISE-1:</b> should be based on self-learning and Formative assessment.</p>
                  <p className="m-0"><b>ISE-2:</b> should be based on self-learning and Formative assessment.</p>
                  <p className="m-0"><b>MSE:</b> Written examination based on 50% syllabus</p>
                  <p className="m-0"><b>ESE:</b> Written examination based on remaining 50% syllabus</p>
                </>
              ) : (
                <>
                  <p className="font-bold m-0 mt-1">Practical:</p>
                  <p className="font-bold m-0 mt-1">ISE-I:</p>
                  <ul className="m-0 pl-5">
                    <li>Based on predefined rubrics carrying 10 Marks.</li>
                    <li>Mini-project / Activity carrying&ndash;10 Marks</li>
                  </ul>
                  <p className="font-bold m-0 mt-1">ISE-II:</p>
                  <ul className="m-0 pl-5">
                    <li>Based on predefined rubrics carrying 10 Marks</li>
                    <li>Oral and/or Practical Examination&ndash;20 Marks</li>
                  </ul>
                </>
              )}
            </div>
          </Selectable>

          {hasLab && (
            <Selectable id="experiments" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
              <table className="preview-table mt-2">
                <colgroup>
                  <col style={{ width: isLab ? "7%" : "6%" }} />
                  <col style={{ width: "78%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <tbody>
                  <tr><td colSpan={4} className="font-bold">To be Taught in laboratory</td></tr>
                  <tr>
                    <th>&nbsp;</th>
                    <th style={{ textAlign: "left" }} className="font-bold">{isLab ? "Topics wise List of Experiments with relevant topic" : "Topics"}</th>
                    <th className="text-center font-bold">Ref.</th><th className="text-center font-bold">CO{isLab ? "s" : ""}</th>
                  </tr>
                  {course.experiments.map((exp) => (
                    <tr key={exp.number}>
                      <td className="font-bold text-center">{exp.number}</td>
                      <td>{exp.title}: {exp.description}</td>
                      <td className="text-center">--</td>
                      <td className="text-center">--</td>
                    </tr>
                  ))}
                  <tr><td>&nbsp;</td><td className="font-bold">Total</td><td></td><td className="font-bold text-center">--</td></tr>
                </tbody>
              </table>
            </Selectable>
          )}

          <Selectable id="references" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <div>
              <p className="font-bold mt-[5pt] mb-[2.5pt] text-[10pt]" style={{ lineHeight: 1.15 }}>Recommended Books:</p>
              <ul className="m-0 pl-5">
                {(course.reference_books || []).length > 0 ? (course.reference_books || []).map((book) => (
                  <li key={book.title}>{book.authors}. {book.title}. {book.publisher}, {book.edition}, {book.year}.</li>
                )) : <li>--</li>}
              </ul>
            </div>
          </Selectable>
          </main>
        </div>
      </div>
      <style jsx>{`
        .preview-table { width: 100%; border-collapse: collapse; margin-bottom: 8pt; table-layout: fixed; }
        .preview-table td, .preview-table th { border: 0.75pt solid #000; padding: 1.5pt 3pt 1.5pt 4pt; vertical-align: middle; }
        .exam-tbl td, .exam-tbl th { border: 0.75pt solid #000; padding: 1.5pt 3pt 1.5pt 4pt; vertical-align: middle; }
        .col-hdr { font-weight: bold; text-align: center; border-top: 0.75pt solid #000; }
      `}</style>
    </div>
  );
}

function Selectable({ id, selected, onSelect, reviewMode, children }: { id: string; selected?: string; onSelect?: (id: string) => void; reviewMode: boolean; children: React.ReactNode }) {
  return (
    <section
      role={reviewMode ? "button" : undefined}
      tabIndex={reviewMode ? 0 : undefined}
      onClick={() => reviewMode && onSelect?.(id)}
      className={cn("rounded-sm outline-offset-2", reviewMode && "cursor-pointer hover:outline hover:outline-2 hover:outline-primary/50", selected === id && "outline outline-2 outline-primary")}
    >
      {children}
    </section>
  );
}
