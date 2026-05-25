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
  const totalMarks = (course.internal_marks || 0) + (course.external_marks || 0);
  const ise1 = Math.min(course.internal_marks || 0, 20);
  const ise2 = Math.max(Math.min((course.internal_marks || 0) - ise1, 20), 0);
  
  const formatValue = (val: number | string | undefined | null) => {
    if (val === 0 || val === "0" || !val) return "--";
    return val;
  };
  return (
    <div className="h-full overflow-auto bg-zinc-200 p-4 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4">
        <div className="relative w-full bg-white px-[45px] pb-[68px] pt-[57px] text-black shadow-lg">
          <header className="mb-3 flex items-center justify-center border-b border-black pb-1 font-serif leading-tight">
            <div className="mr-4 flex h-[60px] w-[60px] items-center justify-center">
              <img src="/logo.jpeg" alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="text-center">
              <h4 className="mb-0 text-[13px] font-normal">Society of St. Francis Xavier, Pilar&apos;s</h4>
              <h3 className="mb-0 text-[17px] font-bold">Fr. Conceicao Rodrigues College of Engineering</h3>
              <p className="m-0 text-[11px]">Fr. Agnel Ashram, Bandstand, Bandra (W), Mumbai - 400 050<br />(Autonomous College affiliated to University of Mumbai)</p>
            </div>
          </header>
          <main>
          {reviewMode && (
            <div className="review-banner">
              <h4 className="text-left">Reviewer Read-Only Curriculum View</h4>
              <p>Reviewers comment on selected sections only. The official admin/faculty publishing template is not editable here.</p>
            </div>
          )}
          <Selectable id="basic" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <table className="preview-table">
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "44%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <th rowSpan={2}>Course Code</th>
                  <th rowSpan={2}>Course Name</th>
                  <th colSpan={3}>Teaching Scheme (Hrs/week)</th>
                  <th colSpan={4}>Credits Assigned</th>
                </tr>
                <tr>
                  <th>L</th><th>T</th><th>P</th>
                  <th>L</th><th>T</th><th>P</th><th>Total</th>
                </tr>
                <tr>
                  <td className="text-center text-bold">{course.code}</td>
                  <td className="text-center text-bold">{course.title}</td>
                  <td className="text-center">{formatValue(course.lecture_hours)}</td>
                  <td className="text-center">{formatValue(course.tutorial_hours)}</td>
                  <td className="text-center">{formatValue(course.practical_hours)}</td>
                  <td className="text-center">{formatValue(course.lecture_hours)}</td>
                  <td className="text-center">{formatValue(course.tutorial_hours)}</td>
                  <td className="text-center">{formatValue(course.practical_hours ? Math.ceil(course.practical_hours / 2) : 0)}</td>
                  <td className="text-center text-bold">{formatValue(course.credits)}</td>
                </tr>
              </tbody>
            </table>
          </Selectable>

          <Selectable id="examination" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <table className="preview-table">
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <th rowSpan={2}>Examination Scheme</th>
                  <th>ISE 1</th>
                  <th>ISE 2</th>
                  <th>MSE</th>
                  <th>ESE</th>
                  <th>Total</th>
                </tr>
                <tr>
                  <td className="text-center">{formatValue(ise1)}</td>
                  <td className="text-center">{formatValue(ise2)}</td>
                  <td className="text-center">--</td>
                  <td className="text-center">{formatValue(course.external_marks)}</td>
                  <td className="text-center text-bold">{formatValue(totalMarks)}</td>
                </tr>
              </tbody>
            </table>
          </Selectable>

          <Selectable id="outcomes" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <table className="preview-table avoid-break mt-10">
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "74%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <th className="text-left" colSpan={2}>Pre-requisite Course Codes</th>
                  <td>{course.pre_requisites || "--"}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-bold border-t-0">At the end of the course learner will be able to:</td>
                </tr>
                {course.outcomes.map((outcome, idx) => (
                  <tr key={outcome.code}>
                    {idx === 0 && <td className="text-bold" rowSpan={course.outcomes.length}>Course Outcomes</td>}
                    <td className="text-bold">{outcome.code}</td>
                    <td>{outcome.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Selectable>

          <Selectable id="modules" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <table className="preview-table">
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "66%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Module<br />No.</th>
                  <th>Unit<br />No.</th>
                  <th>Topics</th>
                  <th>Ref.</th>
                  <th>Hrs.</th>
                </tr>
              </thead>
              <tbody>
                {course.modules.flatMap((module) => {
                  const units = module.topics?.length ? module.topics : [{ title: module.title, description: module.content }];
                  return units.map((unit, index) => (
                    <tr key={`${module.number}-${index}`}>
                      {index === 0 && <td className="text-center text-bold" rowSpan={units.length}>{module.number}</td>}
                      <td className="text-center">{index + 1}</td>
                      <td>{unit.title}: {unit.description}</td>
                      <td className="text-center"></td>
                      {index === 0 && <td className="text-center text-bold" rowSpan={units.length}>{module.contact_hours}</td>}
                    </tr>
                  ));
                })}
              </tbody>
              <tfoot>
                <tr><th colSpan={4} className="text-right">Total Hours</th><th className="text-center">{course.modules.reduce((sum, module) => sum + module.contact_hours, 0)}</th></tr>
              </tfoot>
            </table>
          </Selectable>

          <Selectable id="experiments" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <table className="preview-table">
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "70%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <tbody>
                <tr><th>Exp. No.</th><th>Suggested List of Experiments / Tutorials</th><th>CO</th></tr>
                {course.experiments.map((experiment) => (
                  <tr key={experiment.number}><td className="text-center">{experiment.number}</td><td>{experiment.title}: {experiment.description}</td><td className="text-center"></td></tr>
                ))}
              </tbody>
            </table>
          </Selectable>

          <Selectable id="assessments" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h4 className="preview-subheading text-left">Course Assessment:</h4>
            <ol className="preview-list">
              {course.assessments.map((assessment) => (
                <li key={assessment.component}><strong>{assessment.component} ({assessment.marks} marks):</strong> {assessment.description}</li>
              ))}
            </ol>
          </Selectable>

          <Selectable id="references" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h4 className="preview-subheading text-left">Recommended Books:</h4>
            <ol className="preview-list">
              {(course.reference_books || []).map((book) => (
                <li key={book.title}>{book.authors}. <em>{book.title}</em>. {book.publisher}, {book.edition}, {book.year}.</li>
              ))}
            </ol>
          </Selectable>
          </main>
        </div>
      </div>
      <style jsx>{`
        .preview-table { width: 100%; border-collapse: collapse; margin-bottom: 8pt; table-layout: fixed; break-inside: auto; font-family: "Times New Roman", Times, serif; font-size: 10pt; line-height: 1.15; }
        .preview-table tr { break-inside: avoid; }
        .preview-table th, .preview-table td { border: 0.5pt solid #000; padding: 1.5mm 1mm; text-align: left; vertical-align: middle; overflow-wrap: break-word; word-wrap: break-word; hyphens: auto; }
        .preview-table th { font-weight: bold; text-align: center; }
        .preview-subheading { font-family: "Times New Roman", Times, serif; font-size: 11pt; font-weight: bold; margin: 10pt 0 4pt; }
        .preview-list { margin-top: 2pt; padding-left: 5mm; font-family: "Times New Roman", Times, serif; font-size: 9.5pt; line-height: 1.15; }
        .avoid-break { break-inside: avoid; }
        .mt-10 { margin-top: 10pt; }
        .text-center { text-align: center !important; }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .text-bold { font-weight: bold; }
        .review-banner { border: 0.5pt solid #000; padding: 2mm; margin-bottom: 8pt; font-family: "Times New Roman", Times, serif; font-size: 8.5pt; line-height: 1.15; }
        .review-banner h4 { font-size: 11pt; font-weight: bold; margin: 0 0 2pt; }
        .review-banner p { margin: 0; }
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
