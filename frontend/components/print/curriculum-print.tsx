'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { DEFAULT_BOOKLET_DATA } from "@/lib/default-booklet-data";
import { CoursePrint, InstitutionalHeader } from "@/components/print/course-print";
import { apiFetch } from "@/lib/api";
import { Printer, ArrowLeft, CheckCircle2 } from "lucide-react";

export type BookletData = typeof DEFAULT_BOOKLET_DATA;

export function CurriculumPrint({
  initialData,
  version = "FRCRCE-2-25",
  schemeId,
  yearOfStudy = "SE",
  departmentId,
}: {
  initialData?: BookletData;
  version?: string;
  schemeId?: string;
  yearOfStudy?: string;
  departmentId?: string;
}) {
  const [data, setData] = useState<BookletData>(initialData || DEFAULT_BOOKLET_DATA);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "fonts" in document) {
      document.fonts.ready
        .then(() => {
          const isLoaded = document.fonts.check("12px 'Times New Roman Custom'");
          setFontsLoaded(isLoaded);
        })
        .catch((err) => {
          console.error("Font loading error:", err);
          setFontsLoaded(true);
        });
    } else {
      setFontsLoaded(true);
    }
  }, []);

  // Live client-side revalidation if schemeId is available
  useEffect(() => {
    const targetSchemeId = schemeId || (initialData?.scheme?.id ?? "sch-ce-2025");
    if (!targetSchemeId) return;

    let cancelled = false;
    async function refreshBooklet() {
      try {
        setIsUpdating(true);
        const yos = yearOfStudy || initialData?.year_of_study || "SE";
        const fresh = await apiFetch<BookletData>(`/curriculum-schemes/${targetSchemeId}/booklet-data?year_of_study=${yos}`);
        if (!cancelled && fresh && fresh.semesters) {
          setData(fresh);
        }
      } catch (err) {
        console.warn("Could not refresh live booklet data from worker, using current data:", err);
      } finally {
        if (!cancelled) setIsUpdating(false);
      }
    }

    refreshBooklet();
    return () => {
      cancelled = true;
    };
  }, [schemeId, yearOfStudy]);

  const department = data.department || DEFAULT_BOOKLET_DATA.department;
  const scheme = data.scheme || DEFAULT_BOOKLET_DATA.scheme;
  const semesters = data.semesters || DEFAULT_BOOKLET_DATA.semesters;
  const electives = data.electives || DEFAULT_BOOKLET_DATA.electives;
  const detailedCourses = data.detailed_courses || DEFAULT_BOOKLET_DATA.detailed_courses;
  const revisionLabel = data.revision_label || `FRCRCE-2-${scheme.scheme_year_code || "25"}`;

  const sem3 = semesters.find((s) => s.number === 3) || DEFAULT_BOOKLET_DATA.semesters.find((s) => s.number === 3);
  const sem4 = semesters.find((s) => s.number === 4) || DEFAULT_BOOKLET_DATA.semesters.find((s) => s.number === 4);
  const sem5 = semesters.find((s) => s.number === 5) || DEFAULT_BOOKLET_DATA.semesters.find((s) => s.number === 5);
  const sem6 = semesters.find((s) => s.number === 6) || DEFAULT_BOOKLET_DATA.semesters.find((s) => s.number === 6);

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

  // Compute start page numbers for detailed courses (Page 8 onwards)
  let currentCoursePage = 8;

  return (
    <div className="booklet-wrapper">
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />

      {/* Screen-Only Floating Action Bar */}
      <aside className="screen-toolbar no-print fixed top-0 left-0 right-0 z-50 bg-[#1B2430] text-white px-6 py-2.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="/publishing"
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Publishing Console</span>
          </a>
          <div className="h-4 w-px bg-zinc-700" />
          <div>
            <div className="text-xs font-bold tracking-wide flex items-center gap-2">
              <span>{department.name} — Second Year B.E. Booklet</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                {revisionLabel}
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">
              63-Page Autonomous Curriculum Specification · Live Dynamic Mode
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isUpdating && (
            <span className="text-[10px] text-zinc-400 italic">Syncing latest database updates...</span>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-primary text-primary-foreground hover:bg-primary/90 shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </aside>

      <main
        className="print-document pt-12 print:pt-0"
        data-print-version={version}
        data-fonts-loaded={fontsLoaded ? "true" : "false"}
      >
        {/* ==================================================================== */}
        {/* PAGE 1: TITLE COVER PAGE                                             */}
        {/* ==================================================================== */}
        <section className="cover-page page">
          <div className="cover-content flex flex-col justify-between h-full min-h-[260mm]">
            <div className="cover-top space-y-4 pt-12">
              <h1 className="text-3xl font-bold tracking-wider" style={{ fontSize: "24pt" }}>
                CURRICULUM STRUCTURE
              </h1>
              <h2 className="text-xl font-normal" style={{ fontSize: "16pt", marginTop: "12mm" }}>
                SECOND YEAR UG: B.E.
              </h2>
              <div
                className="cover-program font-bold underline"
                style={{ fontSize: "22pt", marginTop: "16mm", marginBottom: "16mm" }}
              >
                {department.name.toUpperCase()}
              </div>
              <div className="text-lg font-bold font-mono tracking-wide" style={{ fontSize: "14pt" }}>
                REVISION: {revisionLabel}
              </div>
              <p className="text-sm" style={{ fontSize: "11pt", marginTop: "8mm" }}>
                Effective from Academic Year 2025-26
              </p>
            </div>

            <div className="cover-middle space-y-2 my-auto" style={{ fontSize: "10pt" }}>
              <p>Board of Studies Approval: 28/02/25</p>
              <p>Academic Council Approval 14/02/2025, 08/03/25 &amp; 25/06/2025</p>
            </div>

            <div className="signature-grid">
              <div>
                <strong>Dr. DEEPAK BHOIR</strong>
                <br />
                Dean Academics
              </div>
              <div>
                <strong>Dr. Sujata P. Deshmukh</strong>
                <br />
                HOD ({department.code === "COMP" ? "Computer" : department.code})
              </div>
              <div>
                <strong>DR. SURENDRA RATHOD</strong>
                <br />
                Principal
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* PAGE 2: PREAMBLE                                                     */}
        {/* ==================================================================== */}
        <section className="preamble-page page">
          <InstitutionalHeader department={department} pageNumber={2} />
          <h2 className="section-label" style={{ fontSize: "12pt", margin: "6pt 0 4pt" }}>
            Preamble:
          </h2>
          <p style={{ textAlign: "justify", textIndent: "15mm", marginBottom: "8pt" }}>
            Greetings and congratulations to all the education partners Fr Conceicao Rodrigues College of
            Engineering for getting autonomous status to the college from the year 2024-25. University Grant
            Commission vide letter No. F. 2-10/2023(AC-Policy) dated 23<sup>rd</sup> Nov 2023 conferred the
            autonomous status to Fr. Conceicao Rodrigues College of Engineering, Fr. Agnel Ashram, Bandstand,
            Bandra (West), Mumbai 400050 affiliated to University of Mumbai for a period of 10 years from the
            academic year 2024-2025 to 2033-2034 as per clause 7.5 of the UGC (Conferment of Autonomous Status
            Upon Colleges and Measures for Maintenance of Standards in Autonomous Colleges) Regulations, 2023. We
            look towards autonomy as a great opportunity to design and implement curriculum sensitive to needs of
            Learner, Indian Society and Industries.
          </p>
          <p style={{ textAlign: "justify", textIndent: "15mm", marginBottom: "8pt" }}>
            Government of Maharashtra has also directed Autonomous Colleges to revise their curriculum in line with
            National Education Policy (NEP) 2020 through Government Resolution dated 4<sup>th</sup> July 2023. We
            commit to ourselves to the effective implementation of UGC Regulations and NEP 2020 in its spirit.
          </p>
          <p style={{ textAlign: "justify", textIndent: "15mm", marginBottom: "8pt" }}>
            Based on recent recommendations of the GR, we are pleased to offer our holistic curriculum for 2024-28,
            a <strong>“H-Tree Model”</strong> of Engineering Education. A unique{" "}
            <strong>“H - Tree Model”</strong> of Engineering Education Curriculum is carefully designed to
            systematically develop IQ (Intelligence Quotient), PQ (Physical Quotient), EQ (Emotional Quotient) and
            SQ (Spiritual Quotient) of a learner. This curriculum aims at the development of an all-rounded
            personality with holistic approach to education in which learner receives{" "}
            <strong>
              25% teacher-led learning, 25% peer learning, 25% self-learning and 25% experiential learning
            </strong>
            . The curriculum model is outcome based that focuses on learning by doing. Curriculum is designed to
            provide multiple learning opportunities for students to acquire and demonstrate competencies for
            rewarding careers. It ensures multiple choices to leaner acquiring skills through systematic
            planning. It has 7 verticals aligned to GR recommendations with strong science, and mathematics
            foundation and program core, sequel of electives, Multidisciplinary Minor courses, humanities &amp;
            management courses and sufficient experiential learning through projects and semester-long industry /
            research internship along with employable skill-based courses. Learner gets an opportunity to acquire
            skills through NSDC aligned courses during summer vacations. Learner also gets additional option to
            choose the kind of degree i.e. Honors or Double Minor or Honors with Research.
          </p>
          <p style={{ textAlign: "justify", textIndent: "15mm", marginBottom: "8pt" }}>
            Various steps are taken to transform teaching learning process to make learning a joyful experience
            for students. We believe that this curriculum will raise the bar of academic standards with the active
            involvement and cooperation from students, academic and administrative units.
          </p>
        </section>

        {/* ==================================================================== */}
        {/* PAGE 3: CURRICULUM STRUCTURE & NOMENCLATURE                          */}
        {/* ==================================================================== */}
        <section className="policy-page page">
          <InstitutionalHeader department={department} pageNumber={3} />
          <h1 className="doc-title" style={{ fontSize: "11pt", margin: "4pt 0 8pt" }}>
            Curriculum Structure for UG Programs at Fr CRCE w.e.f. A.Y. 2024-25
          </h1>

          <h2 className="section-label" style={{ fontSize: "10pt", margin: "6pt 0 3pt" }}>
            Credit Specification:
          </h2>
          <ul style={{ paddingLeft: "6mm", margin: "0 0 8pt", listStyleType: "none", fontSize: "9pt" }}>
            <li className="mb-1">❖ Theory: 1 credit = 13 to 15 hrs of teaching</li>
            <li className="mb-1">❖ Lab: 1 Credit = 26 to 30 hrs of lab work</li>
            <li className="mb-1">❖ Studio Activities: 1 Credit = 26 to 30 hrs of creative activities</li>
            <li className="mb-1">
              ❖ Workshop Based Activities: 1 Credit = 26 to 30 hrs of hands-on activities related to
              vocation/professional practice/skill based
            </li>
            <li className="mb-1">❖ Seminar/Group Discussion: 1 Credit = 13 to 15 hrs of participation</li>
            <li className="mb-1">❖ Internship: 1 Credit = Per 2 weeks OR 36 to 40 hrs of engagement</li>
            <li className="mb-1">❖ Field Based Learning/Practices: 1 Credit = 26 to 30 hrs of learning activities</li>
            <li className="mb-1">
              ❖ Community Engagement Projects: 1 Credit = 26 to 30 hrs of contact time along with 13 to 15 hrs of
              activities preparation, report writing, independent reading etc.
            </li>
          </ul>

          <h2 className="section-label" style={{ fontSize: "10pt", margin: "6pt 0 4pt" }}>
            Nomenclature of the courses in the curriculum
          </h2>
          <table className="official-table" style={{ fontSize: "8.5pt" }}>
            <colgroup>
              <col style={{ width: "25%" }} />
              <col style={{ width: "75%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="center bold">Abbreviation</th>
                <th className="left bold">Title</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["BSESC", "Basic Science & Engineering Science Courses"],
                ["PCPEC", "Program Core and Program Elective Courses"],
                ["MDC", "Multidisciplinary Courses"],
                ["SC", "Skill Courses"],
                ["HSSM", "Humanities, Social Sciences and Management"],
                ["EL", "Experiential Learning"],
                ["LLC", "Liberal Learning Courses"],
                ["BSC", "Basic Science Courses"],
                ["ESC", "Engineering Science Courses"],
                ["PCC", "Program Core Courses"],
                ["PEC", "Program Elective Courses"],
                ["MDM", "Multidisciplinary Minor"],
                ["OE", "Open Elective"],
                ["VSEC", "Vocational and Skill Enhancement Course"],
                ["VSC", "Vocational Skill Courses"],
                ["SEC", "Skill Enhancement Courses"],
                ["AEC", "Ability Enhancement Course"],
                ["EEMC", "Entrepreneurship, Economics and Management Course"],
                ["IKS", "Indian Knowledge System"],
                ["VEC", "Value Education"],
                ["RM", "Research Methodologies"],
                ["CEFP", "Community Engagement or Field Project"],
                ["ELC", "Experiential Learning Courses"],
                ["PRJ", "Project"],
                ["INT", "Internship"],
                ["CC", "Cocurricular Courses"],
                ["HMM", "Honors and Multidisciplinary Minor"],
                ["DM", "Double Minor"],
                ["BC", "Bridge Course"],
              ].map(([abbr, fullTitle]) => (
                <tr key={abbr}>
                  <td className="center bold monospace" style={{ padding: "1.2mm 1mm" }}>
                    {abbr}
                  </td>
                  <td style={{ padding: "1.2mm 2mm" }}>{fullTitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ==================================================================== */}
        {/* PAGE 4: DEGREE OPTIONS & SALIENT FEATURES                            */}
        {/* ==================================================================== */}
        <section className="page">
          <InstitutionalHeader department={department} pageNumber={4} />
          <h2 className="section-label" style={{ fontSize: "10.5pt", margin: "4pt 0 6pt" }}>
            Credit requirements for four different options of the Degrees:
          </h2>
          <table className="official-table" style={{ fontSize: "8pt" }}>
            <colgroup>
              <col style={{ width: "38%" }} />
              <col span={8} style={{ width: "6.5%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="left bold">Degree/SEM</th>
                <th className="center bold">I</th>
                <th className="center bold">II</th>
                <th className="center bold">III</th>
                <th className="center bold">IV</th>
                <th className="center bold">V</th>
                <th className="center bold">VI</th>
                <th className="center bold">VII</th>
                <th className="center bold">VIII</th>
                <th className="center bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>B.Tech with Multidisciplinary Minor</td>
                <td className="center">20</td>
                <td className="center">20</td>
                <td className="center">22</td>
                <td className="center">22</td>
                <td className="center">22</td>
                <td className="center">22</td>
                <td className="center">20</td>
                <td className="center">20</td>
                <td className="center bold">168</td>
              </tr>
              <tr>
                <td>B.Tech with Double Minor (Multidisciplinary &amp; Specialisation Minor)</td>
                <td className="center">20</td>
                <td className="center">20+2*</td>
                <td className="center">22+4*</td>
                <td className="center">22+4*</td>
                <td className="center">22+4*</td>
                <td className="center">22+4*</td>
                <td className="center">20+2$</td>
                <td className="center">20+2$</td>
                <td className="center bold">188</td>
              </tr>
              <tr>
                <td>B.Tech with Research and Multidisciplinary Minor</td>
                <td className="center">20</td>
                <td className="center">20+2*</td>
                <td className="center">22+4*</td>
                <td className="center">22+4*</td>
                <td className="center">22+4*</td>
                <td className="center">22+4*</td>
                <td className="center">20+2$</td>
                <td className="center">20+2$</td>
                <td className="center bold">188</td>
              </tr>
            </tbody>
          </table>
          <p className="footnote" style={{ fontSize: "7.5pt", margin: "2pt 0 12pt" }}>
            *Optional Credits &nbsp;&nbsp;&nbsp;&nbsp; $ credits (2) to be earned in VII/VIII
          </p>

          <h2 className="section-label" style={{ fontSize: "10.5pt", margin: "8pt 0 4pt" }}>
            Salient Features of Curriculum:
          </h2>
          <ul style={{ paddingLeft: "4mm", listStyleType: "none", fontSize: "9pt", lineHeight: 1.35 }}>
            <li className="mb-2">
              ✓ Framed as per Government Resolution dated 4<sup>th</sup> July 2023 in line with National
              Education Policy (NEP) 2020.
            </li>
            <li className="mb-2">
              ✓ Minimum <strong>168</strong> choice-based credit structure with options of Degrees earning
              additional credits.
            </li>
            <li className="mb-2">
              ✓ Unique <strong>‘H - Tree’</strong> Model of Curriculum: Hybrid model for holistic development
              with happy learning environment having bridge connecting verticals providing unique path for each
              learner for 3-dimensional growth, Life Long Learning, bridge courses, inclusive model indicating
              equal distribution of central resources.
            </li>
            <li className="mb-2">✓ More emphasis on laboratory based and experiential learning.</li>
            <li className="mb-2">✓ More weightage to continuous assessment to reduce examination stress.</li>
            <li className="mb-2">
              ✓ Mandatory Semester-long internship, courses with emotional &amp; spiritual learning and skill-based
              learning aligned with NSDC framework.
            </li>
            <li className="mb-2">
              ✓ Well balanced curriculum to attain Program Outcomes and skills of 21<sup>st</sup> century learner.
            </li>
            <li className="mb-2">
              ✓ Curriculum is designed to create excitement among learners for education through stories,
              activities, collaboration, hackathon, contest, case studies, creative art etc.
            </li>
            <li className="mb-2">
              ✓ Curriculum is designed to make graduates responsible citizens of country with future ready skills
              to handle challenges of 21<sup>st</sup> Century.
            </li>
          </ul>
        </section>

        {/* ==================================================================== */}
        {/* PAGE 5: SEMESTERWISE CURRICULUM STRUCTURE (SEM III & IV)             */}
        {/* ==================================================================== */}
        <section className="page">
          <InstitutionalHeader department={department} pageNumber={5} />
          <h1 className="semester-title" style={{ fontSize: "11pt", margin: "2pt 0" }}>
            SEMESTERWISE CURRICULUM STRUCTURE
          </h1>
          <h2
            className="semester-subtitle"
            style={{ fontSize: "10pt", margin: "2pt 0 6pt", textAlign: "center" }}
          >
            UG Computer Engineering Program:
          </h2>

          {/* SEM - III Table */}
          <div style={{ marginBottom: "8pt" }}>
            <h3 style={{ fontSize: "9.5pt", fontWeight: "bold", textAlign: "left", margin: "2pt 0" }}>
              SEM - III
            </h3>
            <SemesterStructureTable courses={sem3?.courses || []} defaultTotals={{ th: 16, tu: 0, pr: 12, contact: 28, marks: 1100, credits: 22 }} />
            <div className="footnote" style={{ fontSize: "6.5pt", marginTop: "2pt" }}>
              <p style={{ margin: "1pt 0" }}>$ DM/HR 2 credits for Later Entry Students in second year</p>
              <p style={{ margin: "1pt 0" }}># / *- Optional subjects</p>
            </div>
          </div>

          {/* SEM - IV Table */}
          <div>
            <h3 style={{ fontSize: "9.5pt", fontWeight: "bold", textAlign: "left", margin: "2pt 0" }}>
              SEM - IV
            </h3>
            <SemesterStructureTable courses={sem4?.courses || []} defaultTotals={{ th: 16, tu: 0, pr: 12, contact: 28, marks: 1100, credits: 22 }} />
            <div className="footnote" style={{ fontSize: "6.5pt", marginTop: "2pt" }}>
              <p style={{ margin: "1pt 0" }}>
                $ Discipline specific additional course to Lateral Entry (Diploma) students from Swayam
                Plus/Swayam platform
              </p>
              <p style={{ margin: "1pt 0", fontStyle: "italic" }}>
                For Self - Learning , refer Annexure
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* PAGE 6: SEM - V, SEM - VI, AND FINAL YEAR STRUCTURE                  */}
        {/* ==================================================================== */}
        <section className="page">
          <InstitutionalHeader department={department} pageNumber={6} />
          
          {/* SEM - V Table */}
          <div style={{ marginBottom: "6pt" }}>
            <h3 style={{ fontSize: "9.5pt", fontWeight: "bold", textAlign: "left", margin: "2pt 0" }}>
              SEM - V
            </h3>
            <SemesterStructureTable courses={sem5?.courses || []} defaultTotals={{ th: 14, tu: 0, pr: 16, contact: 30, marks: 1100, credits: 22 }} />
          </div>

          {/* SEM - VI Table */}
          <div style={{ marginBottom: "6pt" }}>
            <h3 style={{ fontSize: "9.5pt", fontWeight: "bold", textAlign: "left", margin: "2pt 0" }}>
              SEM - VI
            </h3>
            <SemesterStructureTable courses={sem6?.courses || []} defaultTotals={{ th: 12, tu: 0, pr: 20, contact: 32, marks: 1100, credits: 22 }} />
          </div>

          {/* Final Year Structure */}
          <div>
            <h3 style={{ fontSize: "9pt", fontWeight: "bold", textAlign: "left", margin: "2pt 0" }}>
              Structure of Credits to be completed in Final Year (SEM-VII and/or SEM-VIII):
            </h3>
            <h4 style={{ fontSize: "8.5pt", fontWeight: "bold", textAlign: "left", margin: "1pt 0" }}>
              SEM - VII and/or SEM - VIII
            </h4>
            <table className="official-table multi-level-table" style={{ fontSize: "6.5pt" }}>
              <colgroup>
                <col style={{ width: "13%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "27%" }} />
                <col style={{ width: "10%" }} />
                <col span={5} style={{ width: "5%" }} />
                <col span={2} style={{ width: "3.5%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2}>Course Code</th>
                  <th rowSpan={2}>Course Vertical</th>
                  <th rowSpan={2}>Sub - Vertical</th>
                  <th rowSpan={2}>Course Name</th>
                  <th rowSpan={2}>Contact Hours</th>
                  <th colSpan={5}>Examination Marks (1 Credit=50 Marks)</th>
                  <th colSpan={2}>Credits</th>
                </tr>
                <tr>
                  <th>ISE1</th>
                  <th>MSE</th>
                  <th>ISE2</th>
                  <th>ESE</th>
                  <th>Total</th>
                  <th>Points</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>--</td>
                  <td>PCPEC</td>
                  <td>PEC</td>
                  <td>Program Elective</td>
                  <td className="center">Online</td>
                  <td colSpan={5} className="center">As Per SWAYAM</td>
                  <td className="center">12</td>
                  <td className="center bold">12</td>
                </tr>
                <tr>
                  <td className="monospace">MDMXX06</td>
                  <td>MDC</td>
                  <td>MDM</td>
                  <td>MDM Course - 6 @</td>
                  <td className="center">Online</td>
                  <td colSpan={5} className="center">As Per SWAYAM</td>
                  <td className="center">4</td>
                  <td className="center bold">4</td>
                </tr>
                <tr>
                  <td className="monospace">RMC14CE01</td>
                  <td>EL</td>
                  <td>RM</td>
                  <td>Essentials of Research Methodology</td>
                  <td className="center">Online</td>
                  <td colSpan={5} className="center">As Per SWAYAM</td>
                  <td className="center">2</td>
                  <td className="center bold">2</td>
                </tr>
                <tr>
                  <td className="monospace">RMC14CE02</td>
                  <td>EL</td>
                  <td>RM</td>
                  <td>Intellectual Property Rights</td>
                  <td className="center">Online</td>
                  <td colSpan={5} className="center">As Per SWAYAM</td>
                  <td className="center">2</td>
                  <td className="center bold">2</td>
                </tr>
                <tr>
                  <td className="monospace">PRJ14CE01</td>
                  <td>EL</td>
                  <td>PR</td>
                  <td>Capstone Project</td>
                  <td className="center">PR 12</td>
                  <td className="center">100</td>
                  <td className="center">-</td>
                  <td className="center">100</td>
                  <td className="center">-</td>
                  <td className="center">200</td>
                  <td className="center">6</td>
                  <td className="center bold">6</td>
                </tr>
                <tr>
                  <td>--</td>
                  <td>PCPEC</td>
                  <td>PEC</td>
                  <td>Course Seminar</td>
                  <td className="center">Online</td>
                  <td colSpan={5} className="center">As per Rubrics for Seminar</td>
                  <td className="center">2</td>
                  <td className="center bold">2</td>
                </tr>
                <tr>
                  <td className="monospace">DMX5/HR06</td>
                  <td>DM/HR</td>
                  <td>DM/RMM</td>
                  <td>Seminar/Project</td>
                  <td className="center">PR 4</td>
                  <td colSpan={5} className="center">As per Rubrics for Seminar/Project</td>
                  <td className="center">2*</td>
                  <td className="center bold">2*</td>
                </tr>
                <tr>
                  <td className="monospace">INT14CE01</td>
                  <td>EL</td>
                  <td>INT</td>
                  <td>Semester long Internship</td>
                  <td className="center">PR 36-40 hrs</td>
                  <td colSpan={5} className="center">As Per Internship Manual</td>
                  <td className="center">12</td>
                  <td className="center bold">12</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={10} className="bold left">Total</td>
                  <td className="center bold">40</td>
                  <td className="center bold">40</td>
                </tr>
              </tfoot>
            </table>
            <div className="footnote" style={{ fontSize: "6.2pt", marginTop: "2pt", lineHeight: 1.25 }}>
              <p style={{ margin: "1pt 0" }}>@MDM should be Technical courses related to MDM</p>
              <p style={{ margin: "1pt 0" }}>Project or Internship is mutually exclusive in SEM-VII or SEM-VIII</p>
              <p style={{ margin: "1pt 0" }}>Remaining credits can be acquired in SEM-V to SEM-VIII</p>
              <p style={{ margin: "1pt 0" }}># Online course 1 Credit=4 Week course from SWAYAM can be taken in SEM V to SEM VIII</p>
              <p style={{ margin: "1pt 0" }}># Online min 8 week course from SWAYAM can be taken in SEM V to SEM VIII to complete 2 credit course (Combination of two 4-week credit courses shall be allowed with prior approval)</p>
              <p style={{ margin: "1pt 0" }}>* Online min 12 week course from SWAYAM can be taken in SEM V to SEM VIII to complete 3 credit course</p>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* PAGE 7: LIST OF PROGRAM ELECTIVE COURSES                             */}
        {/* ==================================================================== */}
        <section className="page">
          <InstitutionalHeader department={department} pageNumber={7} />
          <h1 className="doc-title" style={{ fontSize: "11pt", margin: "4pt 0 8pt" }}>
            List of Program Elective Courses:
          </h1>

          {/* Dynamic Tracks Table */}
          <div style={{ marginBottom: "10pt" }}>
            <table className="official-table" style={{ fontSize: "8.5pt" }}>
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "40%" }} />
                <col style={{ width: "40%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="left bold">Track</th>
                  <th className="left bold">Sem. V - PCE1 (Th+Pr) Credits 3</th>
                  <th className="left bold">Sem. VI - PCE2 (Th +Pr) Credits 3</th>
                </tr>
              </thead>
              <tbody>
                {electives.tracks.map((track: any) => (
                  <tr key={track.id || track.track_name}>
                    <td className="bold">{track.track_name}</td>
                    <td>
                      {track.sem5_code && <span className="monospace mr-1">{track.sem5_code}:</span>}
                      {track.sem5_title}
                    </td>
                    <td>
                      {track.sem6_code && <span className="monospace mr-1">{track.sem6_code}:</span>}
                      {track.sem6_title}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dynamic Labs Table */}
          <div style={{ marginBottom: "10pt" }}>
            <table className="official-table" style={{ fontSize: "8.5pt" }}>
              <colgroup>
                <col style={{ width: "50%" }} />
                <col style={{ width: "50%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="left bold">Sem. V- PECL1: (Lab) Credits 1</th>
                  <th className="left bold">Sem. VI- PECL2: (Lab) Credits 1</th>
                </tr>
              </thead>
              <tbody>
                {electives.labs.map((lab: any) => (
                  <tr key={lab.id || lab.sem5_title}>
                    <td>
                      {lab.sem5_code && <span className="monospace mr-1">{lab.sem5_code}:</span>}
                      {lab.sem5_title || "--"}
                    </td>
                    <td>
                      {lab.sem6_code && <span className="monospace mr-1">{lab.sem6_code}:</span>}
                      {lab.sem6_title || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dynamic Modern Indian Languages AEC */}
          <div>
            <h2 className="section-label" style={{ fontSize: "10pt", margin: "6pt 0 4pt" }}>
              List of Modern Indian Language (2 credit) (AEC):
            </h2>
            <ul style={{ paddingLeft: "6mm", listStyleType: "none", fontSize: "9pt", lineHeight: 1.5 }}>
              {electives.aec.map((item: any) => (
                <li key={item.id || item.sem5_title}>
                  • {item.sem5_code && <span className="monospace font-bold mr-2">{item.sem5_code}</span>}
                  <span>{item.sem5_title}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* PAGES 8 TO 61: DETAILED COURSE SYLLABI                               */}
        {/* ==================================================================== */}
        {detailedCourses.map((course: any) => {
          const coursePage = currentCoursePage;
          // Approximate pages: standard courses take 2 to 3 pages
          currentCoursePage += course.course_type === "LAB" ? 4 : 2;

          return (
            <CoursePrint
              key={course.code}
              course={course}
              department={department}
              pageNumber={coursePage}
            />
          );
        })}

        {/* ==================================================================== */}
        {/* PAGES 62 & 63: ANNEXURE: SELF - LEARNING                             */}
        {/* ==================================================================== */}
        {/* Page 62: Semester III Self-Learning */}
        <section className="page annexure-page">
          <InstitutionalHeader department={department} pageNumber={62} />
          <h1 className="doc-title" style={{ fontSize: "11.5pt", margin: "2pt 0" }}>
            Annexure
          </h1>
          <h2
            className="section-label"
            style={{ fontSize: "10.5pt", textAlign: "center", margin: "2pt 0 6pt" }}
          >
            Self - Learning &nbsp;&nbsp; Effective from Academic Year 2025 - 26
          </h2>
          <h3 style={{ fontSize: "9.5pt", fontWeight: "bold", textAlign: "left", margin: "2pt 0 4pt" }}>
            Semester III
          </h3>
          <SelfLearningTable courses={sem3?.courses || []} totalHours={660} totalCredits={22} isSem3={true} />
          <div className="footnote" style={{ fontSize: "7pt", marginTop: "3pt" }}>
            <p style={{ margin: "1pt 0" }}>$ DM/HR 2 credits for Later Entry Students in second year</p>
            <p style={{ margin: "1pt 0" }}># / *- Optional subjects</p>
          </div>
        </section>

        {/* Page 63: Semester IV Self-Learning */}
        <section className="page annexure-page">
          <InstitutionalHeader department={department} pageNumber={63} />
          <h3 style={{ fontSize: "9.5pt", fontWeight: "bold", textAlign: "left", margin: "4pt 0 4pt" }}>
            Semester IV
          </h3>
          <SelfLearningTable courses={sem4?.courses || []} totalHours={660} totalCredits={22} isSem3={false} />
          <div className="footnote" style={{ fontSize: "7pt", marginTop: "3pt" }}>
            <p style={{ margin: "1pt 0" }}>
              @- Discipline specific additional course to Lateral Entry (Diploma) students from Swayam Plus/Swayam platform
            </p>
          </div>
          <div
            style={{
              marginTop: "8pt",
              fontSize: "8.5pt",
              lineHeight: 1.35,
              textAlign: "justify",
            }}
          >
            <p>
              As part of the self-learning component, faculty members will assign specific topics or
              activities to students as per number of hours given in the above table that align with the
              course outcomes. Students are expected to independently explore, research, and perform the
              assigned tasks, thereby enhancing their critical thinking and problem-solving abilities. Upon
              completion, the faculty will evaluate the work based on appropriate assessment methods defined by
              the faculty.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Dynamic Semester Structure Table for Page 5 and 6
// -----------------------------------------------------------------------------
function SemesterStructureTable({
  courses,
  defaultTotals,
}: {
  courses: any[];
  defaultTotals: { th: number; tu: number; pr: number; contact: number; marks: number; credits: number };
}) {
  return (
    <table className="official-table multi-level-table" style={{ fontSize: "6.5pt" }}>
      <colgroup>
        <col style={{ width: "13%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "27%" }} />
        <col style={{ width: "10%" }} />
        <col span={5} style={{ width: "5%" }} />
        <col span={2} style={{ width: "3.5%" }} />
      </colgroup>
      <thead>
        <tr>
          <th rowSpan={2}>Course Code</th>
          <th rowSpan={2}>Course Vertical</th>
          <th rowSpan={2}>Sub - Vertical</th>
          <th rowSpan={2}>Course Name</th>
          <th rowSpan={2}>Contact Hours</th>
          <th colSpan={5}>Examination Marks (1 Credit=50 Marks)</th>
          <th colSpan={2}>Credits</th>
        </tr>
        <tr>
          <th>ISE1</th>
          <th>MSE</th>
          <th>ISE2</th>
          <th>ESE</th>
          <th>Total</th>
          <th>Points</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => {
          const comps = course.components && course.components.length > 0
            ? course.components
            : [
                {
                  component_type: course.course_type === "LAB" ? "PR" : "TH",
                  hours: course.lecture_hours || course.practical_hours || 2,
                  ise_marks: Math.min(course.internal_marks || 20, 20),
                  mse_marks: course.course_type === "LAB" ? null : 30,
                  ise2_marks: Math.min(course.internal_marks || 20, 20),
                  ese_max_marks: course.external_marks || 30,
                  total_marks: (course.internal_marks || 0) + (course.external_marks || 0) || 100,
                  credit_points: Number(course.credits) || 2,
                },
              ];

          const rowSpan = comps.length;
          const firstComp = comps[0];

          return (
            <tbody key={course.id || course.code} style={{ borderTop: "0.5pt solid black" }}>
              <tr>
                <td rowSpan={rowSpan} className="monospace bold center">
                  {course.code}
                </td>
                <td rowSpan={rowSpan} className="center">
                  {course.vertical || "PCPEC"}
                </td>
                <td rowSpan={rowSpan} className="center">
                  {course.sub_vertical || "PCC"}
                </td>
                <td rowSpan={rowSpan} className="bold">
                  {course.title}
                </td>
                <td className="center">
                  {firstComp.component_type} {firstComp.hours}
                </td>
                <td className="center">{firstComp.ise_marks ?? "--"}</td>
                <td className="center">{firstComp.mse_marks ?? "-"}</td>
                <td className="center">{firstComp.ise2_marks ?? firstComp.ise_marks ?? "--"}</td>
                <td className="center">{firstComp.ese_max_marks ?? "-"}</td>
                <td className="center">
                  {firstComp.total_marks ??
                    (firstComp.ise_marks || 0) + (firstComp.mse_marks || 0) + (firstComp.ese_max_marks || 0)}
                </td>
                <td className="center">{firstComp.credit_points}</td>
                <td rowSpan={rowSpan} className="center bold">
                  {course.credits}
                </td>
              </tr>
              {comps.slice(1).map((comp: any, idx: number) => (
                <tr key={`${course.id}-comp-${idx}`}>
                  <td className="center">
                    {comp.component_type} {comp.hours}
                  </td>
                  <td className="center">{comp.ise_marks ?? "--"}</td>
                  <td className="center">{comp.mse_marks ?? "-"}</td>
                  <td className="center">{comp.ise2_marks ?? comp.ise_marks ?? "--"}</td>
                  <td className="center">{comp.ese_max_marks ?? "-"}</td>
                  <td className="center">
                    {comp.total_marks ??
                      (comp.ise_marks || 0) + (comp.mse_marks || 0) + (comp.ese_max_marks || 0)}
                  </td>
                  <td className="center">{comp.credit_points}</td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={4} className="bold center">Total</td>
          <td className="center bold">
            TH:TU:PR {defaultTotals.th}:{defaultTotals.tu}:{defaultTotals.pr}={defaultTotals.contact}
          </td>
          <td colSpan={2} className="center">-</td>
          <td colSpan={2} className="center">-</td>
          <td className="center bold">{defaultTotals.marks}</td>
          <td className="center">-</td>
          <td className="center bold">{defaultTotals.credits}</td>
        </tr>
      </tfoot>
    </table>
  );
}

// -----------------------------------------------------------------------------
// Component: Dynamic Self-Learning Table for Pages 62 & 63
// -----------------------------------------------------------------------------
function SelfLearningTable({
  courses,
  totalHours,
  totalCredits,
  isSem3,
}: {
  courses: any[];
  totalHours: number;
  totalCredits: number;
  isSem3: boolean;
}) {
  return (
    <table className="official-table multi-level-table" style={{ fontSize: "6.5pt" }}>
      <colgroup>
        <col style={{ width: "14%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "26%" }} />
        <col span={2} style={{ width: "7%" }} />
        <col style={{ width: "7%" }} />
        <col style={{ width: "7%" }} />
        <col style={{ width: "7%" }} />
        <col style={{ width: "7%" }} />
      </colgroup>
      <thead>
        <tr>
          <th rowSpan={2}>Course Code</th>
          <th rowSpan={2}>Course Vertical</th>
          <th rowSpan={2}>Sub - Vertical</th>
          <th rowSpan={2}>Course Name</th>
          <th colSpan={2}>Classroom Instruction (CI)<br />(in hours per semester)</th>
          <th rowSpan={2}>Lab Instruction (LI)<br />(in hours per semester)</th>
          <th rowSpan={2}>Self - Learning<br />(in hours per semester)</th>
          <th rowSpan={2}>Total no. of Hours per semester</th>
          <th rowSpan={2}>Total Credits</th>
        </tr>
        <tr>
          <th>Lecture</th>
          <th>Tutorial</th>
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => {
          const lecHours = (course.lecture_hours || (course.course_type === "THEORY" || course.course_type === "THEORY_LAB" ? 2 : 0)) * 15;
          const tutHours = (course.tutorial_hours || 0) * 15;
          const prHours = (course.practical_hours || (course.course_type === "LAB" || course.course_type === "THEORY_LAB" ? 2 : 0)) * 15;
          const slHours = course.self_learning_hours ? course.self_learning_hours * 15 : (course.course_type === "LAB" ? 0 : 30);
          const totalCourseHours = lecHours + tutHours + prHours + slHours;

          return (
            <tr key={`sl-${course.id || course.code}`}>
              <td className="monospace bold center">{course.code}</td>
              <td className="center">{course.vertical || "PCPEC"}</td>
              <td className="center">{course.sub_vertical || "PCC"}</td>
              <td className="bold">{course.title}</td>
              <td className="center">{lecHours || "-"}</td>
              <td className="center">{tutHours || "-"}</td>
              <td className="center">{prHours || "-"}</td>
              <td className="center">{slHours || "-"}</td>
              <td className="center">{totalCourseHours || "-"}</td>
              <td className="center bold">{course.credits}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={8} className="bold left">Total Number of Hours</td>
          <td className="center bold">{totalHours}</td>
          <td className="center bold">{totalCredits}</td>
        </tr>
      </tfoot>
    </table>
  );
}
