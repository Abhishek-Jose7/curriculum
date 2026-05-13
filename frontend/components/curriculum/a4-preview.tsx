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
  const totalMarks = course.examination.internal_marks + course.examination.external_marks;
  return (
    <div className="h-full overflow-auto bg-zinc-200 p-4 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4">
        <Page course={course} pageNumber={1}>
          <Selectable id="basic" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h2 className="preview-title">{course.code}: {course.title}</h2>
            <table className="preview-table">
              <tbody>
                <tr><th>Course Type</th><td>{course.course_type}</td><th>Credits</th><td>{course.teaching.credits}</td></tr>
                <tr><th>Prerequisites</th><td colSpan={3}>{course.pre_requisites || "Nil"}</td></tr>
              </tbody>
            </table>
          </Selectable>

          <Selectable id="teaching" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h3 className="preview-heading">Teaching Scheme</h3>
            <table className="preview-table compact">
              <tbody>
                <tr><th>Lecture</th><th>Tutorial</th><th>Practical</th><th>Credits</th></tr>
                <tr><td>{course.teaching.lecture_hours}</td><td>{course.teaching.tutorial_hours}</td><td>{course.teaching.practical_hours}</td><td>{course.teaching.credits}</td></tr>
              </tbody>
            </table>
          </Selectable>

          <Selectable id="examination" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h3 className="preview-heading">Examination Scheme</h3>
            <table className="preview-table compact">
              <tbody>
                <tr><th>Internal</th><th>External</th><th>Total</th><th>Duration</th><th>Passing</th></tr>
                <tr><td>{course.examination.internal_marks}</td><td>{course.examination.external_marks}</td><td>{totalMarks}</td><td>{course.examination.duration_hours} hrs</td><td>{course.examination.passing_marks}</td></tr>
              </tbody>
            </table>
          </Selectable>

          <Selectable id="objectives" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h3 className="preview-heading">Course Objectives</h3>
            <p>{course.objectives}</p>
          </Selectable>

          <Selectable id="outcomes" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h3 className="preview-heading">Course Outcomes</h3>
            <table className="preview-table">
              <tbody>
                <tr><th>CO</th><th>Description</th><th>Bloom Level</th></tr>
                {course.outcomes.map((outcome) => (
                  <tr key={outcome.code}><td>{outcome.code}</td><td>{outcome.description}</td><td>{outcome.bloom_level}</td></tr>
                ))}
              </tbody>
            </table>
          </Selectable>
        </Page>

        <Page course={course} pageNumber={2}>
          <Selectable id="modules" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h3 className="preview-heading">Detailed Syllabus</h3>
            {course.modules.map((module) => (
              <table className="preview-table avoid-break" key={module.number}>
                <tbody>
                  <tr><th colSpan={2}>Module {module.number}: {module.title}</th><th>Hours</th></tr>
                  <tr><td colSpan={2}>{module.content}</td><td>{module.contact_hours}</td></tr>
                  {(module.topics ?? []).map((topic, index) => (
                    <tr key={`${module.number}-${topic.title}`}><td>{index + 1}</td><td colSpan={2}><strong>{topic.title}</strong>: {topic.description}</td></tr>
                  ))}
                </tbody>
              </table>
            ))}
          </Selectable>
        </Page>

        <Page course={course} pageNumber={3}>
          <Selectable id="experiments" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h3 className="preview-heading">Experiments / Tutorials</h3>
            <table className="preview-table">
              <tbody>
                <tr><th>No.</th><th>Title</th><th>Hours</th></tr>
                {course.experiments.map((experiment) => (
                  <tr key={experiment.number}><td>{experiment.number}</td><td><strong>{experiment.title}</strong><br />{experiment.description}</td><td>{experiment.hours}</td></tr>
                ))}
              </tbody>
            </table>
          </Selectable>

          <Selectable id="assessments" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h3 className="preview-heading">Assessment Scheme</h3>
            <table className="preview-table">
              <tbody>
                <tr><th>Component</th><th>Marks</th><th>Description</th></tr>
                {course.assessments.map((assessment) => (
                  <tr key={assessment.component}><td>{assessment.component}</td><td>{assessment.marks}</td><td>{assessment.description}</td></tr>
                ))}
              </tbody>
            </table>
          </Selectable>

          <Selectable id="references" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <h3 className="preview-heading">Recommended Books / References</h3>
            <table className="preview-table">
              <tbody>
                <tr><th>No.</th><th>Reference</th><th>Type</th></tr>
                {course.references.map((book, index) => (
                  <tr key={book.title}><td>{index + 1}</td><td>{book.authors}. <em>{book.title}</em>. {book.publisher}, {book.edition}, {book.year}.</td><td>{book.is_textbook ? "Textbook" : "Reference"}</td></tr>
                ))}
              </tbody>
            </table>
          </Selectable>
        </Page>
      </div>
      <style jsx>{`
        .preview-title { font-family: "Times New Roman", serif; font-size: 18px; text-align: center; text-transform: uppercase; font-weight: 700; margin-bottom: 12px; }
        .preview-heading { font-family: "Times New Roman", serif; font-size: 15px; text-align: center; text-transform: uppercase; font-weight: 700; margin: 12px 0 8px; }
        .preview-table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-family: "Times New Roman", serif; font-size: 13px; line-height: 1.25; }
        .preview-table th, .preview-table td { border: 1px solid #111; padding: 5px 6px; vertical-align: top; }
        .preview-table th { background: #f3f3f3; text-align: center; font-weight: 700; }
        .preview-table.compact td { text-align: center; }
        .avoid-break { break-inside: avoid; }
        p { font-family: "Times New Roman", serif; font-size: 13px; line-height: 1.35; }
      `}</style>
    </div>
  );
}

function Page({ course, pageNumber, children }: { course: CourseDraft; pageNumber: number; children: React.ReactNode }) {
  return (
    <div className="relative min-h-[1123px] w-full bg-white px-[60px] py-[72px] text-black shadow-lg">
      <header className="absolute left-[60px] right-[60px] top-[28px] border-b border-black pb-2 text-center font-serif text-[13px] leading-tight">
        <strong>Official University</strong><br />
        College of Engineering - Department of Computer Engineering
      </header>
      <main>{children}</main>
      <footer className="absolute bottom-[28px] left-[60px] right-[60px] grid grid-cols-3 border-t border-black pt-2 font-serif text-[11px]">
        <span>{course.code}</span>
        <span className="text-center">Page {pageNumber}</span>
        <span className="text-right">Academic Year 2026-27</span>
      </footer>
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
