"use client";

import { Copy, BookPlus, Loader2, Link2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface SemesterOption {
  id: number;
  number: number;
  academic_year_name: string;
  department_code?: string;
}

export function InviteTeacherPanel() {
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  
  const [semesterId, setSemesterId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseType, setCourseType] = useState("THEORY");
  const [email, setEmail] = useState("");
  
  const [inviteUrl, setInviteUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadSemesters() {
      try {
        const res = await apiFetch<any>("/semesters/");
        const list = Array.isArray(res) ? res : res.results ?? [];
        setSemesters(list);
        if (list.length > 0) {
          setSemesterId(String(list[0].id));
        }
      } catch (err) {
        console.error("Failed to load semesters", err);
      } finally {
        setLoadingSemesters(false);
      }
    }
    void loadSemesters();
  }, []);

  async function createSubjectAndInvite() {
    if (!semesterId || !courseCode || !courseTitle || !email) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    
    setStatus("sending");
    setErrorMsg("");
    setInviteUrl("");
    
    try {
      const existingRes = await apiFetch<any>(`/courses/?semester=${semesterId}&search=${encodeURIComponent(courseCode)}`);
      const existingList = Array.isArray(existingRes) ? existingRes : existingRes.results ?? [];
      const existingCourse = existingList.find((c: any) => c.code.toLowerCase() === courseCode.toLowerCase());
      
      let targetCourseId;
      
      if (existingCourse) {
        targetCourseId = existingCourse.id;
      } else {
        const newCourse = await apiFetch<any>("/courses/", {
          method: "POST",
          body: JSON.stringify({
            semester: Number(semesterId),
            code: courseCode,
            title: courseTitle,
            course_type: courseType,
            credits: 0,
            lecture_hours: 0,
            tutorial_hours: 0,
            practical_hours: 0,
            internal_marks: 0,
            external_marks: 0,
          }),
        });
        targetCourseId = newCourse.id;
      }

      const data = await apiFetch<any>(`/courses/${targetCourseId}/invite_teacher/`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      
      setInviteUrl(data.invitation_url);
      setStatus("sent");
      setCourseCode("");
      setCourseTitle("");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      let message = err.message || "Failed to create subject or send invite.";
      try {
        const parsed = JSON.parse(message);
        if (typeof parsed === "object") {
          message = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(", ");
        }
      } catch (e) {
        // Not JSON
      }
      setErrorMsg(message);
    }
  }

  return (
    <section className="rounded border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="border-b border-border/80 pb-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center text-primary">
          <BookPlus className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-serif font-bold text-foreground">Draft Subject &amp; Assign Coordinator</h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Register a new curriculum catalog entry and generate a secure syllabus drafting token.
          </p>
        </div>
      </div>

      {loadingSemesters ? (
        <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-muted-foreground/60">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Validating semester structure registers...
        </div>
      ) : semesters.length === 0 ? (
        <div className="p-4 rounded bg-amber-500/5 border border-amber-500/10 text-xs font-bold text-amber-600 text-center leading-relaxed">
          No semesters configured. Please initialize academic semester tiers in the left sidebar tab.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Select Semester Tier</span>
              <select
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary cursor-pointer"
                value={semesterId}
                onChange={(event) => setSemesterId(event.target.value)}
              >
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id} className="bg-card text-foreground">
                    {sem.department_code || "COMP"} - Sem {sem.number} ({sem.academic_year_name})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Subject Code</span>
              <input
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
                placeholder="e.g. CS301"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Subject Title</span>
              <input
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                value={courseTitle}
                onChange={(event) => setCourseTitle(event.target.value)}
                placeholder="e.g. Data Structures &amp; Algorithms"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Syllabus Type</span>
              <select
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary cursor-pointer"
                value={courseType}
                onChange={(event) => setCourseType(event.target.value)}
              >
                <option value="THEORY" className="bg-card text-foreground">Theory Coursework</option>
                <option value="LAB" className="bg-card text-foreground">Practical (Lab Work)</option>
                <option value="THEORY_LAB" className="bg-card text-foreground">Integrated Theory &amp; Practical</option>
                <option value="PROJECT" className="bg-card text-foreground">Project Shell</option>
                <option value="ELECTIVE" className="bg-card text-foreground">Elective Shell</option>
              </select>
            </label>
            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Coordinator Email Address</span>
              <input
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teacher@college.edu"
              />
            </label>
          </div>
          
          <Button
            className="w-full md:w-auto h-10 mt-2"
            onClick={() => void createSubjectAndInvite()}
            disabled={status === "sending"}
          >
            {status === "sending" ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating credentials...
              </>
            ) : (
              "Initialize Subject & Generate Token"
            )}
          </Button>
        </div>
      )}

      {inviteUrl && (
        <div className="rounded border border-primary/20 bg-primary/5 p-4 space-y-3.5 mt-4 animate-fade-in">
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Subject entry added successfully
          </div>
          <div className="flex gap-2">
            <div className="h-10 flex-1 rounded border border-border bg-zinc-950 px-3.5 flex items-center min-w-0 font-mono text-xs">
              <span className="text-zinc-300 truncate w-full">{inviteUrl}</span>
            </div>
            <Button
              variant="secondary"
              className="h-10 px-4 font-bold text-[10px]"
              onClick={() => {
                void navigator.clipboard.writeText(inviteUrl);
                alert("Subject invitation link copied to clipboard!");
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground/60 leading-relaxed flex items-center gap-1">
            <Link2 className="h-3 w-3 text-primary shrink-0" />
            Distribute this link. Accepting coordination locks writing credentials for the coordinate teacher.
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-600 font-bold mt-2 leading-relaxed bg-rose-500/5 p-3 rounded border border-rose-500/10">
          {errorMsg}
        </p>
      )}
    </section>
  );
}
