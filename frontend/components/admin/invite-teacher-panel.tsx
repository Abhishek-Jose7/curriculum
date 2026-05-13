"use client";

import { Copy, MailPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const demoCourses = [
  { id: 1, code: "CS301", title: "Data Structures and Algorithms" },
  { id: 2, code: "CS352", title: "Database Management Systems Lab" },
  { id: 3, code: "CS415", title: "Machine Learning" }
];

export function InviteTeacherPanel() {
  const [courseId, setCourseId] = useState("1");
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function inviteTeacher() {
    setStatus("sending");
    try {
      const token = window.localStorage.getItem("accessToken") ?? "";
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"}/courses/${courseId}/invite_teacher/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setInviteUrl(data.invitation_url);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-md border border-border">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold">Invite Teacher to Subject</h2>
        <p className="mt-1 text-sm text-foreground/60">Enter a teacher email and send a subject-specific editing link. The link assigns access only to that course.</p>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_1fr_auto]">
        <label>
          <span className="text-sm font-medium">Subject</span>
          <select className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            {demoCourses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.title}</option>)}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium">Teacher Email</span>
          <input className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teacher@college.edu" />
        </label>
        <Button className="self-end" onClick={() => void inviteTeacher()} disabled={!email || status === "sending"}><MailPlus className="h-4 w-4" />Send Link</Button>
      </div>
      {inviteUrl && (
        <div className="border-t border-border p-4">
          <div className="text-sm font-medium">Generated subject link</div>
          <div className="mt-2 flex gap-2">
            <input className="h-10 min-w-0 flex-1 rounded-md border border-border bg-muted px-3 text-sm" readOnly value={inviteUrl} />
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(inviteUrl)}><Copy className="h-4 w-4" />Copy</Button>
          </div>
          <p className="mt-2 text-xs text-foreground/60">Invitation email sent through the backend.</p>
        </div>
      )}
      {status === "error" && <p className="border-t border-border p-4 text-sm text-rose-700">Invite failed. Sign in as admin/HOD and make sure `accessToken` is available for API calls.</p>}
    </section>
  );
}
