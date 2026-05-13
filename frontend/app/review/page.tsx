"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { A4Preview } from "@/components/curriculum/a4-preview";
import { sampleCourse } from "@/lib/sample-course";

const sectionLabels: Record<string, string> = {
  basic: "Basic Details",
  teaching: "Teaching Scheme",
  examination: "Examination Scheme",
  objectives: "Course Objectives",
  outcomes: "Course Outcomes",
  modules: "Modules",
  experiments: "Experiments/Tutorials",
  assessments: "Assessments",
  references: "References"
};

export default function ReviewPage() {
  const [selected, setSelected] = useState("outcomes");
  const [comments, setComments] = useState(sampleCourse.comments);
  const [draft, setDraft] = useState("");

  return (
    <AppShell>
      <div className="grid min-h-[calc(100vh-104px)] overflow-hidden rounded-md border border-border xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{sampleCourse.code} {sampleCourse.title}</h2>
                <StatusBadge status="UNDER_REVIEW" />
              </div>
              <p className="text-sm text-foreground/60">Select a rendered document section to attach structured reviewer comments.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">Request Changes</Button>
              <Button>Approve Content</Button>
            </div>
          </div>
          <div className="h-[calc(100vh-185px)]">
            <A4Preview course={sampleCourse} reviewMode selectedSection={selected} onSelectSection={setSelected} />
          </div>
        </section>
        <aside className="border-l border-border bg-background">
          <div className="border-b border-border p-4">
            <h3 className="font-semibold">Section Comments</h3>
            <p className="text-sm text-foreground/60">Selected: {sectionLabels[selected] ?? selected}</p>
          </div>
          <div className="h-[calc(100vh-262px)] space-y-3 overflow-auto p-4">
            {comments.filter((comment) => comment.section_key.includes(selected) || comment.section_key === selected).map((comment) => (
              <div key={comment.id} className="rounded-md border border-border p-3">
                <div className="text-sm font-medium">{comment.section_label}</div>
                <p className="mt-2 text-sm text-foreground/75">{comment.body}</p>
                <div className="mt-2 text-xs text-foreground/55">{comment.reviewer_name}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <textarea className="min-h-28 w-full rounded-md border border-border bg-background p-3 text-sm" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Comment on ${sectionLabels[selected] ?? selected}`} />
            <Button className="mt-3 w-full" onClick={() => { if (!draft.trim()) return; setComments([...comments, { id: Date.now(), section_key: selected, section_label: sectionLabels[selected] ?? selected, body: draft, reviewer_name: "Current Reviewer", is_resolved: false }]); setDraft(""); }}>Add Section Comment</Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
