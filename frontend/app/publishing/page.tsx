import { FileCheck2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export default function PublishingPage() {
  return (
    <AppShell>
      <section className="rounded-md border border-border p-5">
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Final Curriculum Assembly</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <select className="h-10 rounded-md border border-border bg-background px-3"><option>Computer Engineering</option></select>
          <select className="h-10 rounded-md border border-border bg-background px-3"><option>2026-27</option></select>
          <select className="h-10 rounded-md border border-border bg-background px-3"><option>Official University Template</option></select>
        </div>
        <div className="mt-5 flex gap-2">
          <Button>Generate Official PDF</Button>
          <Button variant="secondary">Generate DOCX</Button>
        </div>
      </section>
    </AppShell>
  );
}
