"use client";

import { Copy, BookPlus, Loader2 } from "lucide-react";
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
      // 1. Check if course already exists in this semester
      const existingRes = await apiFetch<any>(`/courses/?semester=${semesterId}&search=${encodeURIComponent(courseCode)}`);
      const existingList = Array.isArray(existingRes) ? existingRes : existingRes.results ?? [];
      
      // DRF search might return partial matches, so filter exactly by code
      const existingCourse = existingList.find((c: any) => c.code.toLowerCase() === courseCode.toLowerCase());
      
      let targetCourseId;
      
      if (existingCourse) {
        targetCourseId = existingCourse.id;
      } else {
        // 2. Create the course if it doesn't exist
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

      // 3. Send the invite
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
        // Attempt to parse DRF error messages if it's JSON
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
    <section className="rounded-md border border-border bg-zinc-900/10 backdrop-blur-sm p-5 space-y-4">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookPlus className="h-5 w-5 text-primary" />
          Create Subject & Assign Teacher
        </h2>
        <p className="mt-1 text-sm text-foreground/60">
          Create a new subject and instantly send a syllabus-writing invite link to the assigned teacher.
        </p>
      </div>

      {loadingSemesters ? (
        <div className="flex items-center justify-center py-6 gap-2 text-sm text-foreground/55">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading semesters...
        </div>
      ) : semesters.length === 0 ? (
        <div className="p-4 rounded bg-amber-500/5 border border-amber-500/10 text-sm text-amber-500 text-center">
          No semesters found. Please create semesters first.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-foreground/80">Select Semester</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                value={semesterId}
                onChange={(event) => setSemesterId(event.target.value)}
              >
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.department_code || "COMP"} - Sem {sem.number} ({sem.academic_year_name})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-foreground/80">Subject Code</span>
              <input
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
                placeholder="e.g. CS301"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-foreground/80">Subject Title</span>
              <input
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                value={courseTitle}
                onChange={(event) => setCourseTitle(event.target.value)}
                placeholder="e.g. Data Structures"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-foreground/80">Course Type</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                value={courseType}
                onChange={(event) => setCourseType(event.target.value)}
              >
                <option value="THEORY">Theory</option>
                <option value="LAB">Practical (Lab)</option>
                <option value="THEORY_LAB">Theory and Practical</option>
                <option value="PROJECT">Project</option>
                <option value="ELECTIVE">Elective</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-foreground/80">Teacher Email</span>
              <input
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teacher@college.edu"
              />
            </label>
          </div>
          
          <Button
            className="w-full md:w-auto"
            onClick={() => void createSubjectAndInvite()}
            disabled={status === "sending"}
          >
            {status === "sending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              "Create Subject & Invite"
            )}
          </Button>
        </div>
      )}

      {inviteUrl && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2 mt-4">
          <div className="text-sm font-medium text-primary">Success! Generated Subject Link</div>
          <div className="flex gap-2">
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-border bg-zinc-950 px-3 text-sm font-mono text-zinc-300"
              readOnly
              value={inviteUrl}
            />
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(inviteUrl);
                alert("Link copied to clipboard!");
              }}
            >
              <Copy className="h-4 w-4" /> Copy
            </Button>
          </div>
          <p className="text-xs text-foreground/60">
            Send this link to the teacher. Opening it accepts their subject assignment.
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-sm text-rose-500 font-medium mt-2">
          {errorMsg}
        </p>
      )}
    </section>
  );
}
