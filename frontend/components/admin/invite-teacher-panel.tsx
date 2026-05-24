"use client";

import { Copy, MailPlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface CourseOption {
  id: number;
  code: string;
  title: string;
}

export function InviteTeacherPanel() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await apiFetch<any>("/courses/");
        const list = Array.isArray(res) ? res : res.results ?? [];
        setCourses(list);
        if (list.length > 0) {
          setCourseId(String(list[0].id));
        }
      } catch (err) {
        console.error("Failed to load courses in admin panel", err);
      } finally {
        setLoadingCourses(false);
      }
    }
    void loadCourses();
  }, []);

  async function inviteTeacher() {
    if (!courseId) return;
    setStatus("sending");
    try {
      const data = await apiFetch<any>(`/courses/${courseId}/invite_teacher/`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setInviteUrl(data.invitation_url);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-md border border-border bg-zinc-900/10 backdrop-blur-sm p-5 space-y-4">
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MailPlus className="h-5 w-5 text-primary" />
          Invite Teacher to Subject
        </h2>
        <p className="mt-1 text-sm text-foreground/60">
          Enter a teacher&apos;s email to send a subject-specific syllabus writing link. The link assigns access only to that course shell.
        </p>
      </div>

      {loadingCourses ? (
        <div className="flex items-center justify-center py-6 gap-2 text-sm text-foreground/55">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading department course shells...
        </div>
      ) : courses.length === 0 ? (
        <div className="p-4 rounded bg-amber-500/5 border border-amber-500/10 text-sm text-amber-500 text-center">
          No courses found. Please create course shells first using the creation form below.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-foreground/80">Select Course Subject</span>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-foreground/80">Teacher Email Address</span>
            <input
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teacher@college.edu"
            />
          </label>
          <Button
            className="w-full md:w-auto"
            onClick={() => void inviteTeacher()}
            disabled={!email || status === "sending"}
          >
            {status === "sending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inviting...
              </>
            ) : (
              "Send Subject Link"
            )}
          </Button>
        </div>
      )}

      {inviteUrl && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="text-sm font-medium text-primary">Generated Subject Link</div>
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

      {status === "error" && (
        <p className="text-sm text-rose-500 font-medium">
          Failed to send invite link. Make sure the backend server is running and seeded.
        </p>
      )}
    </section>
  );
}
