'use client';

import { useEffect, useState } from "react";
import type { PrintCurriculum } from "@/lib/print-fixture";
import { CoursePrint, SemesterStructure } from "@/components/print/course-print";

export function CurriculumPrint({ curriculum, version }: { curriculum: PrintCurriculum; version: string }) {
  const courses = curriculum.semesters.flatMap((semester) => semester.courses);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        const isLoaded = document.fonts.check("12px 'Times New Roman Custom'");
        setFontsLoaded(isLoaded);
      }).catch((err) => {
        console.error("Font loading error:", err);
        setFontsLoaded(true);
      });
    } else {
      setFontsLoaded(true);
    }
  }, []);

  const fontStyles = `
    @font-face {
      font-family: 'Times New Roman Custom';
      src: url('/fonts/times.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'Times New Roman Custom';
      src: url('/fonts/timesbd.ttf') format('truetype');
      font-weight: bold;
      font-style: normal;
    }
  `;

  return (
    <main 
      className="print-document" 
      data-print-version={version}
      data-fonts-loaded={fontsLoaded ? "true" : "false"}
    >
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
      <section className="cover-page">
        <h1>CURRICULUM BOOK</h1>
        <h2>UNDERGRADUATE PROGRAM: BACHELOR OF ENGINEERING</h2>
        <div className="cover-program">{curriculum.department.name.toUpperCase()}</div>
        <p><strong>Effective from Academic Year:</strong> {curriculum.academicYear.name}</p>
        <p><strong>Status:</strong> Autonomous College Syllabus Handbook</p>
        <div className="signature-grid">
          <div><strong>Dr. Deepak Bhoir</strong><br />Dean Academics</div>
          <div><strong>Dr. Sujata P. Deshmukh</strong><br />HOD ({curriculum.department.code})</div>
          <div><strong>Dr. Surendra Rathod</strong><br />Principal</div>
        </div>
      </section>

      <section className="preamble-page page">
        <h1>ACADEMIC PREAMBLE</h1>
        <p>As an autonomous engineering college affiliated with the University of Mumbai, Fr. Conceicao Rodrigues College of Engineering is dedicated to engineering excellent learners, innovators, and future technical leaders. Autonomy enables the institution to respond to technological shifts and design responsive curricula that balance theoretical foundations with experiential design, modern tools, and professional ethics.</p>
        <p>This curriculum structure represents a unified framework curated in collaboration with academic advisors and leading technical firms. The curriculum emphasizes robust mathematical models, project-based validation, and outcome-oriented professional practice.</p>
        <h2>Vision of the Department</h2>
        <p><em>To be a leading center of excellence in engineering education and research, fostering industry-ready technical innovators, ethically sound professionals, and empathetic citizens.</em></p>
        <h2>Mission of the Department</h2>
        <ul>
          <li>Deliver standard-aligned engineering education using student-centric pedagogy and laboratory environments.</li>
          <li>Foster research, technical incubation, and industry-institution partnerships.</li>
          <li>Cultivate life-long learning habits, teamwork capabilities, and professional ethical standards.</li>
        </ul>
      </section>

      <section className="policy-page page">
        <h1>CURRICULUM ARCHITECTURE AND NEP ALIGNMENT</h1>
        <h2>Course Nomenclature Table</h2>
        <table className="official-table avoid-break">
          <thead><tr><th>Category</th><th>Course Category Name</th><th>NEP-2020 Credit Framework Description</th></tr></thead>
          <tbody>
            {[
              ["BS", "Basic Sciences", "Fundamental disciplines including Physics, Chemistry, and Advanced Calculus."],
              ["ES", "Engineering Sciences", "Interdisciplinary foundations such as Computing, Graphics, and Electrical Systems."],
              ["PC", "Professional Core", "Core discipline-specific subjects, advanced concepts, and matching practicals."],
              ["PE", "Professional Electives", "Branching streams for specialized expertise such as AI/ML, Security, and IoT."],
              ["OE", "Open Electives", "Multi-disciplinary courses offered across departments for wider learning."],
              ["HS", "Humanities and Social Sciences", "Professional Communication, Business Ethics, IPR, and Management."],
            ].map(([code, name, description]) => (
              <tr key={code}><td className="center bold monospace">{code}</td><td>{name}</td><td>{description}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {curriculum.semesters.map((semester) => (
        <SemesterStructure key={semester.id} semester={semester} />
      ))}

      <section className="toc-page page">
        <h1>TABLE OF CONTENTS</h1>
        <table className="official-table">
          <thead><tr><th>Subject Code</th><th>Syllabus Course Title</th><th>Page No.</th></tr></thead>
          <tbody>
            <tr><td>-</td><td>Preamble, Vision and Mission</td><td className="center">ii</td></tr>
            <tr><td>-</td><td>Semester Scheme and Structures</td><td className="center">iii</td></tr>
            {courses.map((course, index) => (
              <tr key={course.code}><td className="monospace bold">{course.code}</td><td>{course.title}</td><td className="center">{index + 5}</td></tr>
            ))}
            <tr><td>-</td><td>Annexure A: Autonomy Policies and Grading Rules</td><td className="center">{courses.length + 5}</td></tr>
            <tr><td>-</td><td>Reviewer Comments Section</td><td className="center">{courses.length + 6}</td></tr>
          </tbody>
        </table>
      </section>

      {courses.map((course) => (
        <CoursePrint key={course.code} course={course} department={curriculum.department} academicYear={curriculum.academicYear} />
      ))}

      <section className="annexure-page page">
        <h1>ANNEXURE A: ACADEMIC POLICIES</h1>
        <h2>1. Evaluation Framework</h2>
        <p>The academic evaluation uses Continuous Internal Evaluation and End Semester Examination components. Students must secure the minimum passing threshold as defined by autonomous college regulations.</p>
        <h2>2. Grading System</h2>
        <p>Under the autonomous framework, grading follows a standard relative system converted to a 10-point CGPA scale.</p>
        <h2>3. Syllabus Revision Protocol</h2>
        <p>Major syllabus revisions occur periodically to absorb technological shifts. Minor corrections and elective introductions may occur annually with Board of Studies recommendations and Academic Council approval.</p>
      </section>

      <section className="reviewer-comments-book page">
        <h1>REVIEWER COMMENTS SECTION</h1>
        <table className="official-table">
          <thead><tr><th>Course</th><th>Section</th><th>Comment</th><th>Status</th></tr></thead>
          <tbody>
            {courses.flatMap((course) => course.comments.map((comment) => (
              <tr key={`${course.code}-${comment.id}`}>
                <td>{course.code}</td>
                <td>{comment.section_label}</td>
                <td>{comment.body}</td>
                <td className="center">{comment.is_resolved ? "Resolved" : "Open"}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
