"use client";

import { useEffect, useState } from "react";
import { Download, FileCheck2, Lock, Loader2, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type Department = { id: number; code: string; name: string };
type AcademicYear = { id: number; name: string };
type Template = { id: number; name: string; is_locked: boolean; version: number };
type PublishedItem = {
  id: number;
  version_label: string;
  pdf: string;
  created_at: string;
  render_metrics: { page_count?: number; course_count?: number; overflow_warnings?: string[] };
};

export default function PublishingPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [published, setPublished] = useState<PublishedItem[]>([]);

  const [selectedDept, setSelectedDept] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [versionLabel, setVersionLabel] = useState("v1");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [depts, yrs, tmpls, pubs] = await Promise.all([
          apiFetch<Department[] | { results: Department[] }>("/departments/"),
          apiFetch<AcademicYear[] | { results: AcademicYear[] }>("/academic-years/"),
          apiFetch<Template[] | { results: Template[] }>("/curriculum-templates/"),
          apiFetch<PublishedItem[] | { results: PublishedItem[] }>("/published-curricula/"),
        ]);
        const d = Array.isArray(depts) ? depts : depts.results ?? [];
        const y = Array.isArray(yrs) ? yrs : yrs.results ?? [];
        const t = Array.isArray(tmpls) ? tmpls : tmpls.results ?? [];
        const p = Array.isArray(pubs) ? pubs : pubs.results ?? [];
        setDepartments(d);
        setYears(y);
        setTemplates(t);
        setPublished(p);
        if (d.length) setSelectedDept(String(d[0].id));
        if (y.length) setSelectedYear(String(y[0].id));
        if (t.length) setSelectedTemplate(String(t[0].id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load publishing data");
      }
    })();
  }, []);

  const handlePublish = async () => {
    if (!selectedDept || !selectedYear || !selectedTemplate || !versionLabel.trim()) return;
    setPublishing(true);
    setResult(null);
    setError(null);
    try {
      const pub = await apiFetch<PublishedItem>("/published-curricula/publish/", {
        method: "POST",
        body: JSON.stringify({
          department: selectedDept,
          academic_year: selectedYear,
          template: selectedTemplate,
          version_label: versionLabel.trim(),
        }),
      });
      setResult(`Published successfully! PDF: ${pub.pdf}`);
      setPublished((prev) => [pub, ...prev]);
      // Refresh templates to show locked status
      const tmpls = await apiFetch<Template[] | { results: Template[] }>("/curriculum-templates/");
      setTemplates(Array.isArray(tmpls) ? tmpls : tmpls.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  const activeTemplate = templates.find((t) => String(t.id) === selectedTemplate);

  return (
    <AppShell>
      <section className="rounded-md border border-border p-5">
        <div className="flex items-center gap-3">
          <FileCheck2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Final Curriculum Assembly</h2>
        </div>
        <p className="mt-2 text-sm text-foreground/60">
          Assemble all approved courses into a single official curriculum PDF. This uses the SAME templates and CSS as the per-course preview — zero divergence.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium">Department</span>
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Academic Year</span>
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Template</span>
            <select className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} v{t.version} {t.is_locked ? "🔒" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Version Label</span>
            <input className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="e.g. v1, rev2" />
          </label>
        </div>

        {activeTemplate?.is_locked && (
          <div className="mt-3 flex items-center gap-2 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Lock className="h-4 w-4" />
            This template is locked from a previous publish. It cannot be edited. Create a copy to make changes.
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />{error}
          </div>
        )}

        {result && (
          <div className="mt-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{result}</div>
        )}

        <div className="mt-5 flex gap-2">
          <Button onClick={() => void handlePublish()} disabled={publishing}>
            {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />}
            Generate Official PDF
          </Button>
        </div>
      </section>

      {published.length > 0 && (
        <section className="mt-6 rounded-md border border-border">
          <div className="border-b border-border p-4">
            <h3 className="font-semibold">Published Curricula</h3>
          </div>
          <div className="divide-y divide-border">
            {published.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{item.version_label}</div>
                  <div className="text-xs text-foreground/60">
                    {new Date(item.created_at).toLocaleString()}
                    {item.render_metrics?.page_count && ` · ${item.render_metrics.page_count} pages`}
                    {item.render_metrics?.course_count && ` · ${item.render_metrics.course_count} courses`}
                  </div>
                  {item.render_metrics?.overflow_warnings?.length ? (
                    <div className="mt-1 text-xs text-amber-700">
                      <AlertTriangle className="mr-1 inline h-3 w-3" />
                      {item.render_metrics.overflow_warnings.length} overflow warning(s)
                    </div>
                  ) : null}
                </div>
                {item.pdf && (
                  <Button variant="secondary" asChild>
                    <a href={item.pdf} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />Download PDF
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
