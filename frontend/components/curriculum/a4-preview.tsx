"use client";

import type { CourseDraft } from "@/types/curriculum";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import { FileDown, Printer, Maximize2, Minimize2 } from "lucide-react";

type Props = {
  course: CourseDraft;
  selectedSection?: string;
  onSelectSection?: (section: string) => void;
  reviewMode?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
};

export function A4Preview({ 
  course, 
  selectedSection, 
  onSelectSection, 
  reviewMode = false,
  isFullScreen = false,
  onToggleFullScreen
}: Props) {
  const isLab = course.course_type === "LAB";
  const hasLab = (course.practical_hours || 0) > 0 || isLab;
  
  const totalMarks = (course.internal_marks || 0) + (course.external_marks || 0);
  const internal = course.internal_marks || 0;
  const mseVal = internal === 50 ? 30 : internal === 40 ? 20 : Math.round(internal * 0.6);
  const iseVal = internal - mseVal;
  const eseMaxVal = course.external_marks || 0;
  const eseMinVal = course.passing_marks || (eseMaxVal === 50 ? 20 : eseMaxVal === 60 ? 24 : Math.round(eseMaxVal * 0.4));
  const theoryTotalVal = iseVal + mseVal + eseMaxVal;
  const hasBloom = (level: string) => 
    course.outcomes.some(o => o.bloom_level?.toLowerCase() === level.toLowerCase());
  const formatValue = (val: number | string | undefined | null) => {
    if (val === 0 || val === "0" || !val) return "--";
    return val;
  };

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

  const totalModuleHours = course.modules.reduce((sum, module) => sum + (module.contact_hours || 0), 0);

  const pageRef = useRef<HTMLDivElement>(null);

  const downloadAsDoc = () => {
    if (!pageRef.current) return;
    
    const css = `
      body { font-family: "Times New Roman", Times, serif; font-size: 10pt; line-height: 1.2; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8pt; table-layout: fixed; }
      td, th { border: 0.75pt solid #000; padding: 3pt 4pt; vertical-align: middle; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
      h1, h2, h3, h4 { margin: 10px 0; }
      .preview-table { width: 100%; border-collapse: collapse; margin-bottom: 8pt; table-layout: fixed; }
      .preview-table td, .preview-table th { border: 0.75pt solid #000; padding: 3pt 4pt; vertical-align: middle; word-break: break-word; overflow-wrap: break-word; }
      .exam-tbl { width: 100%; border-collapse: collapse; margin: 0; }
      .exam-tbl td, .exam-tbl th { border: 0.75pt solid #000; padding: 3pt 4pt; vertical-align: middle; word-break: break-word; overflow-wrap: break-word; }
      .col-hdr { font-weight: bold; text-align: center; }
    `;

    const docContent = pageRef.current.innerHTML;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${course.code} - ${course.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>${css}</style>
      </head>
      <body>
        ${docContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.code}_Syllabus.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printSyllabus = () => {
    window.open(`/print/course/${course.id}/`, "_blank");
  };

  return (
    <div className="h-full w-full overflow-auto bg-zinc-200 p-4 dark:bg-zinc-950 flex flex-col justify-start items-center scrollbar-thin">
      
      {/* Document Control Toolbar */}
      <div className="mx-auto mb-4 flex w-full items-center justify-between gap-3 rounded-md bg-white p-2.5 shadow-sm border border-border dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Syllabus controls</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadAsDoc}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download Word
          </button>
          
          <button
            onClick={printSyllabus}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 transition-all cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Syllabus
          </button>

          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 transition-all cursor-pointer"
            >
              {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          )}
        </div>
      </div>

      <div className="w-full">
        <div 
          ref={pageRef}
          className="bg-white px-[20px] sm:px-[45px] pb-[68px] pt-[57px] text-black shadow-lg w-full font-serif" 
          style={{ 
            fontSize: '10pt', 
            lineHeight: '1.2' 
          }}
        >
          
          <header className="mb-2 flex w-full items-center border-b-[1.5pt] border-black pb-[5pt]">
            <div className="pr-[5pt] w-[21mm]">
              <img src="/logo.jpeg" alt="Institutional Logo" className="h-[19mm] w-[19mm] object-contain block" />
            </div>
            <div className="text-center flex-1 bold font-bold" style={{ lineHeight: 1.38 }}>
              <p className="m-0 text-[8.5pt] italic bold font-bold">Society of St.&nbsp;Francis Xavier, Pilar&rsquo;s</p>
              <p className="m-0 text-[11pt] bold font-bold">Fr. Conceicao Rodrigues College of Engineering</p>
              <p className="m-0 text-[8.5pt] bold font-bold">Fr. Agnel Ashram, Bandstand, Bandra (W), Mumbai &ndash; 400&nbsp;050</p>
              <p className="m-0 text-[8pt] italic bold font-bold">(Autonomous College affiliated to University of Mumbai)</p>
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
                  <td rowSpan={4} className="font-bold text-center">Course Code<br /><br />{course.code}</td>
                  <td rowSpan={4} className="font-bold text-center">Course Name<br /><br /><span className="font-bold">{course.title}</span></td>
                  <td colSpan={4} className="font-bold text-center">Teaching Scheme<br />(Hrs/week)</td>
                  <td colSpan={4} className="font-bold text-center">Credits Assigned</td>
                </tr>
                <tr>
                  <td className="font-bold text-center">L</td>
                  <td className="font-bold text-center">T</td>
                  <td className="font-bold text-center">P</td>
                  <td className="font-bold text-center">SL</td>
                  <td className="font-bold text-center">L</td>
                  <td className="font-bold text-center">T</td>
                  <td className="font-bold text-center">P</td>
                  <td className="font-bold text-center">Total</td>
                </tr>
                <tr>
                  <td className="text-center">{!isLab ? formatValue(course.lecture_hours) : "--"}</td>
                  <td className="text-center">{!isLab ? formatValue(course.tutorial_hours) : "--"}</td>
                  <td className="text-center">{formatValue(course.practical_hours)}</td>
                  <td className="text-center">{!isLab ? formatValue(course.self_learning_hours) : "--"}</td>
                  <td className="text-center">{!isLab ? formatValue(course.lecture_credits) : "--"}</td>
                  <td className="text-center">{!isLab ? formatValue(course.tutorial_credits) : "--"}</td>
                  <td className="text-center">{formatValue(course.practical_credits)}</td>
                  <td className="text-center">{formatValue(course.credits)}</td>
                </tr>
                <tr>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <Selectable id="examination" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
                      <table className="w-full border-collapse m-0 exam-tbl" style={{ fontSize: "9pt", lineHeight: 1.1 }}>
                        <tbody>
                          <tr>
                            <td colSpan={6} className="font-bold text-center border-b-[1pt] border-black pb-[2pt]">Examination Scheme</td>
                          </tr>
                          <tr>
                            <td rowSpan={2} className="col-hdr"></td>
                            <td rowSpan={2} className="col-hdr">ISE</td>
                            <td rowSpan={2} className="col-hdr">MSE</td>
                            <td colSpan={2} className="col-hdr">ESE</td>
                            <td rowSpan={2} className="col-hdr">Total</td>
                          </tr>
                          <tr>
                            <td className="col-hdr" style={{ borderTop: "0.75pt solid #000" }}>Min</td>
                            <td className="col-hdr" style={{ borderTop: "0.75pt solid #000" }}>Max</td>
                          </tr>
                          {isLab ? (
                            <tr>
                              <td className="text-center font-bold">Lab</td>
                              <td className="text-center">{formatValue(course.internal_marks)}</td>
                              <td className="text-center">--</td>
                              <td className="text-center">--</td>
                              <td className="text-center">--</td>
                              <td className="text-center">{formatValue(course.internal_marks)}</td>
                            </tr>
                          ) : !hasLab ? (
                            <tr>
                              <td className="text-center font-bold">Theory</td>
                              <td className="text-center">{formatValue(iseVal)}</td>
                              <td className="text-center">{formatValue(mseVal)}</td>
                              <td className="text-center">{formatValue(eseMinVal)}</td>
                              <td className="text-center">{formatValue(eseMaxVal)}</td>
                              <td className="text-center">{formatValue(theoryTotalVal)}</td>
                            </tr>
                          ) : (
                            <>
                              <tr>
                                <td className="font-bold">Theory</td>
                                <td className="text-center">{formatValue(iseVal)}</td>
                                <td className="text-center">{formatValue(mseVal)}</td>
                                <td className="text-center">{formatValue(eseMinVal)}</td>
                                <td className="text-center">{formatValue(eseMaxVal)}</td>
                                <td className="text-center">{formatValue(theoryTotalVal)}</td>
                              </tr>
                              <tr>
                                <td className="font-bold">Lab</td>
                                <td className="text-center">50</td>
                                <td className="text-center">--</td>
                                <td className="text-center">--</td>
                                <td className="text-center">--</td>
                                <td className="text-center">50</td>
                              </tr>
                            </>
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
                    const units = module.topics?.length ? module.topics : [];
                    const rowSpan = units.length + 1;
                    
                    const renderUnitText = (unit: any) => {
                      if (unit.title && unit.description) {
                        return `${unit.title}: ${unit.description}`;
                      }
                      return unit.title || unit.description || "";
                    };

                    const titleRow = (
                      <tr key={`mod-title-${module.number}`}>
                        <td className="font-bold text-center" rowSpan={rowSpan}>{module.number}</td>
                        <td className="font-bold text-center"></td>
                        <td className="font-bold">{module.title}</td>
                        <td className="text-center" rowSpan={rowSpan}>{module.references || "--"}</td>
                        <td className="text-center" rowSpan={rowSpan}>{module.contact_hours}</td>
                      </tr>
                    );

                    const unitRows = units.map((unit, index) => (
                      <tr key={`mod-unit-${module.number}-${index}`}>
                        <td className="font-bold text-center">{module.number}.{index + 1}</td>
                        <td>{renderUnitText(unit)}</td>
                      </tr>
                    ));

                    return [titleRow, ...unitRows];
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
              <p className="font-bold mt-[5pt] mb-[2.5pt] text-[10pt]" style={{ lineHeight: 1.15 }}>
                <u>Course Assessment:</u>{isLab ? " \u2013 (Lab)" : ""}
              </p>
              {!isLab ? (
                <>
                  <p className="font-bold m-0">Theory:</p>
                  <div className="mt-1 space-y-1">
                    <p className="m-0">
                      <u><strong>ISE:</strong></u> Based on Self-Learning / Formative assessment activities will be conducted during the full semester - 20 Marks
                    </p>
                    <p className="m-0">
                      <u><strong>MSE:</strong></u> 90 minutes 30 Marks written examination based on 50% syllabus
                    </p>
                    <p className="m-0">
                      <u><strong>ESE:</strong></u> ESE examination will be written summative examination for 50 marks based on full syllabus (20% questions on syllabus covered before MSE and 80% questions on the remaining syllabus) for 120 minutes
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold m-0 mt-1">Practical:</p>
                  <p className="font-bold m-0 mt-1"><u>ISE-I:</u></p>
                  <ul className="m-0 pl-5">
                    <li>Based on predefined rubrics carrying 10 Marks.</li>
                    <li>Mini-project / Activity carrying&ndash;10 Marks</li>
                  </ul>
                  <p className="font-bold m-0 mt-1"><u>ISE-II:</u></p>
                  <ul className="m-0 pl-5">
                    <li>Based on predefined rubrics carrying 10 Marks</li>
                    <li>Oral and/or Practical Examination&ndash;20 Marks</li>
                  </ul>
                </>
              )}
            </div>
          </Selectable>

          {(() => {
            const isTheoryOrTheoryLab = course.course_type === "THEORY" || course.course_type === "THEORY_LAB";
            const showExperiments = hasLab || isTheoryOrTheoryLab;
            if (!showExperiments) return null;

            const experimentsList = getExperiments(course.experiments);
            const expHeader = isTheoryOrTheoryLab 
              ? "Suggested List of Laboratory Experiments (Optional)" 
              : "To be Taught in laboratory";

            return (
              <Selectable id="experiments" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
                <table className="preview-table mt-2">
                  <colgroup>
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "77%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>
                  <tbody>
                    <tr><td colSpan={4} className="font-bold">{expHeader}</td></tr>
                    <tr>
                      <th className="font-bold text-center">Exp. No.</th>
                      <th style={{ textAlign: "left" }} className="font-bold">Topics</th>
                      <th className="text-center font-bold">References</th>
                      <th className="text-center font-bold">CO Mapped</th>
                    </tr>
                    {experimentsList.map((exp) => (
                      <tr key={exp.number}>
                        <td className="font-bold text-center">{exp.number}</td>
                        <td>
                          <div className="font-bold">{exp.title}</div>
                          {exp.description ? (
                            <div className="text-[9pt] mt-0.5 text-muted-foreground" style={{ lineHeight: 1.15 }}>
                              Objective: {exp.description}
                            </div>
                          ) : null}
                        </td>
                        <td className="text-center" style={{ fontSize: "8.5pt" }}>{exp.references}</td>
                        <td className="text-center">{exp.coMapped}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Selectable>
            );
          })()}

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

          <Selectable id="video_lectures" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <div className="mt-2">
              <p className="font-bold mt-[5pt] mb-[2.5pt] text-[10pt]" style={{ lineHeight: 1.15 }}>Video Lectures:</p>
              <ol className="m-0 pl-5 list-decimal">
                {(course.online_resources || []).length > 0 ? (course.online_resources || []).map((resource, idx) => (
                  <li key={idx} className="break-all">{resource}</li>
                )) : (
                  <>
                    <li>http://nptel.ac.in/courses/106105031/ lecture by Dr. Debdeep MukhopadhyayIIT Kharagpur</li>
                    <li>https://archive.nptel.ac.in/courses/106105/106105162/</li>
                    <li>https://www.geeksforgeeks.org/cryptography-and-network-security-principles/</li>
                  </>
                )}
              </ol>
            </div>
          </Selectable>

          <Selectable id="copo_matrix" selected={selectedSection} onSelect={onSelectSection} reviewMode={reviewMode}>
            <div className="mt-4">
              <p className="font-bold mb-[2.5pt] text-[10pt]" style={{ lineHeight: 1.15 }}>SUGGESTED CO - PO articulation Matrix</p>
              <table className="copo-table">
                <thead>
                  <tr>
                    <th rowSpan={2} className="font-bold text-center">Course Outcomes</th>
                    <th colSpan={12} className="font-bold text-center">Programme Outcomes (POs)</th>
                    <th colSpan={2} className="font-bold text-center">Programme Specific Outcomes (PSOs)</th>
                  </tr>
                  <tr>
                    {Array.from({ length: 12 }, (_, index) => (
                      <th key={`po-sub-prev-${index}`} className="font-bold text-center">PO{index + 1}</th>
                    ))}
                    <th className="font-bold text-center">PSO1</th>
                    <th className="font-bold text-center">PSO2</th>
                  </tr>
                </thead>
                <tbody>
                  {course.outcomes.map((outcome, row) => (
                    <tr key={outcome.code}>
                      <td className="font-bold text-center">{outcome.code}</td>
                      {/* PO Mappings */}
                      {Array.from({ length: 12 }, (_, col) => {
                        const val = ((row + col) % 4) || "";
                        return <td className="text-center" key={`po-val-prev-${col}`}>{val === 0 ? "" : val}</td>;
                      })}
                      {/* PSO Mappings */}
                      <td className="text-center">{((row + 1) % 3) || 1}</td>
                      <td className="text-center">{((row + 2) % 3) || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="font-bold mt-4 mb-[2.5pt] text-[10pt]" style={{ lineHeight: 1.15 }}>Bloom&apos;s Level:</p>
              <table className="bloom-table">
                <tbody>
                  <tr>
                    <td>Remember {hasBloom("Remember") && "✓"}</td>
                    <td>Understand {hasBloom("Understand") && "✓"}</td>
                    <td className="font-bold">Apply {(!hasBloom("Remember") && !hasBloom("Understand") && !hasBloom("Analyze") && !hasBloom("Evaluate") && !hasBloom("Create")) || hasBloom("Apply") ? "✓" : ""}</td>
                    <td>Analyze {hasBloom("Analyze") && "✓"}</td>
                    <td>Evaluate {hasBloom("Evaluate") && "✓"}</td>
                    <td>Create {hasBloom("Create") && "✓"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Selectable>
          </main>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .preview-table { width: 100%; border-collapse: collapse; margin-bottom: 8pt; table-layout: fixed; }
        .preview-table td, .preview-table th { border: 0.75pt solid #000; padding: 1.5pt 3pt 1.5pt 4pt; vertical-align: middle; word-break: break-word; overflow-wrap: break-word; }
        .exam-tbl { border-collapse: collapse; border: none !important; }
        .exam-tbl td, .exam-tbl th { border: 0.75pt solid #000; padding: 1.5pt 3pt 1.5pt 4pt; vertical-align: middle; word-break: break-word; overflow-wrap: break-word; }
        .exam-tbl tr:first-child td, .exam-tbl tr:first-child th { border-top: none !important; }
        .exam-tbl tr:last-child td { border-bottom: none !important; }
        .exam-tbl tr td:first-child, .exam-tbl tr th:first-child { border-left: none !important; }
        .exam-tbl tr td:last-child, .exam-tbl tr th:last-child { border-right: none !important; }
        .col-hdr { font-weight: bold; text-align: center; border-top: 0.75pt solid #000; }
        .copo-table { width: 100%; border-collapse: collapse; margin-top: 6pt; margin-bottom: 8pt; }
        .copo-table th, .copo-table td { border: 0.75pt solid #000; padding: 3pt 2pt; text-align: center; font-size: 8.5pt; }
        .bloom-table { width: 100%; border-collapse: collapse; margin-top: 4pt; }
        .bloom-table td { border: 0.75pt solid #000; padding: 4pt; text-align: center; font-size: 9pt; }
      ` }} />
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
