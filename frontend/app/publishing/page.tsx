"use client";

import { useEffect, useState } from "react";
import { Download, FileCheck2, Lock, Loader2, AlertTriangle, FileText, CheckCircle2, BookOpen, Layers } from "lucide-react";
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
      setResult(`Published successfully! PDF booklet compiled.`);
      setPublished((prev) => [pub, ...prev]);
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
      <div className="space-y-10 max-w-5xl mx-auto animate-fade-in text-left">
        {/* Editorial Page Title */}
        <section className="space-y-2">
          <div className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">presse &amp; compilation</div>
          <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
            Academic Press &amp; Publication Register
          </h1>
          <div className="w-12 h-0.5 bg-primary/40 my-2" />
          <p className="text-xs text-muted-foreground max-w-2xl font-medium leading-relaxed">
            Configure metadata parameters to assemble courses and structure syllabuses into unified curriculum books. Once generated, booklets are registered in the institution's archive.
          </p>
        </section>

        {/* Compiler Form card */}
        <section className="rounded-sm border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border/80 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <FileCheck2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-foreground">Curriculum Assembly Docket</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Compile all approved course syllabus sections into a single official academic curriculum booklet.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider">Department Selection</span>
              <select 
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer font-serif" 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {departments.map((d) => <option key={d.id} value={d.id} className="bg-card text-foreground">{d.code} — {d.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider">Academic Session</span>
              <select 
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((y) => <option key={y.id} value={y.id} className="bg-card text-foreground">{y.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider">Layout Template spec</span>
              <select 
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer" 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-card text-foreground">
                    {t.name} (v{t.version}) {t.is_locked ? "🔒" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider">Version Identifier</span>
              <input 
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all duration-150 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono" 
                value={versionLabel} 
                onChange={(e) => setVersionLabel(e.target.value)} 
                placeholder="e.g. v1, rev2" 
              />
            </label>
          </div>

          {activeTemplate?.is_locked && (
            <div className="flex items-start gap-2.5 rounded bg-amber-500/5 border border-amber-500/10 p-4 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <Lock className="h-4 w-4 shrink-0 text-amber-500/80 mt-0.5" />
              <span>This template is locked from a previous publish. Create a layout replica copy in layout boards to commit modifications.</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded bg-rose-500/5 border border-rose-500/10 p-4 text-[11px] text-rose-600 font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500/80 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="flex items-start gap-2.5 rounded bg-emerald-500/5 border border-emerald-500/10 p-4 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-serif">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500/80 mt-0.5" />
              <span>{result}</span>
            </div>
          )}

          <div className="pt-2">
            <Button onClick={() => void handlePublish()} disabled={publishing} className="h-10 px-6 font-bold uppercase tracking-wider text-xs rounded-sm">
              {publishing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileCheck2 className="mr-2 h-3.5 w-3.5" />}
              Assemble &amp; Compile Booklet
            </Button>
          </div>
        </section>

        {/* Compiled Booklet list */}
        {published.length > 0 ? (
          <section className="space-y-4">
            <div className="border-b border-border/80 pb-2 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Completed Register Archive
              </h3>
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Historical Booklets</span>
            </div>
            
            <div className="border border-border rounded-sm bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
              {published.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-secondary/15 transition-colors group">
                  <div className="space-y-1.5">
                    <div className="font-serif font-bold text-sm text-foreground flex items-center gap-3">
                      <span className="font-mono text-[9px] bg-muted px-2 py-0.5 rounded-sm text-primary border border-border/50 font-bold uppercase tracking-wider">{item.version_label}</span>
                      <span>Board Release Book Specification</span>
                    </div>
                    
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>COMPILATION: {new Date(item.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{item.render_metrics?.page_count ?? 0} PAGES</span>
                      <span>·</span>
                      <span>{item.render_metrics?.course_count ?? 0} SYLLABUSES</span>
                    </div>
                    
                    {item.render_metrics?.overflow_warnings?.length ? (
                      <div className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-sm border border-amber-500/10 mt-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500/80" />
                        {item.render_metrics.overflow_warnings.length} COMPILATION WARNINGS
                      </div>
                    ) : null}
                  </div>
                  {item.pdf && (
                    <Button variant="secondary" asChild className="h-9 text-[10px] font-bold uppercase tracking-wider rounded-sm shrink-0 border-border/60 hover:bg-muted">
                      <a href={item.pdf} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download Booklet
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="py-12 text-center text-xs font-serif italic text-muted-foreground/60 border border-dashed border-border/80 rounded bg-card/10">
            No compiled booklets registered in the historical archive.
          </div>
        )}
      </div>
    </AppShell>
  );
}
