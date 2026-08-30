"use client";

import { useEffect, useState } from "react";
import { Download, FileCheck2, Lock, Loader2, AlertTriangle, CheckCircle2, BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context";

type Department = { id: number | string; code: string; name: string };
type AcademicYear = { id: number | string; name: string };
type Template = { id: number | string; name: string; is_locked: boolean; version: number };
type SchemeItem = { id: string; entering_year: string; department_id: string; status: string };
type OrderableCourse = { id: string; code: string; title: string; semester_id?: string };

type PublishedItem = {
  id: number | string;
  version_label: string;
  pdf: string;
  year_of_study?: string;
  hod_approved_at?: string | null;
  created_at: string;
  render_metrics: { page_count?: number; course_count?: number; overflow_warnings?: string[] };
};

const YEAR_OF_STUDY_OPTIONS = [
  { value: "FE", label: "FE — First Year", sems: "Sem 1 + 2" },
  { value: "SE", label: "SE — Second Year", sems: "Sem 3 + 4" },
  { value: "TE", label: "TE — Third Year", sems: "Sem 5 + 6" },
  { value: "BE", label: "BE — Final Year", sems: "Sem 7 + 8" },
];

const YOS_COLORS: Record<string, string> = {
  FE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  SE: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  TE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  BE: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
};

export default function PublishingPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [published, setPublished] = useState<PublishedItem[]>([]);

  const [selectedDept, setSelectedDept] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedYos, setSelectedYos] = useState("FE");
  const [versionLabel, setVersionLabel] = useState("v1");
  const [publishing, setPublishing] = useState(false);
  const [approvingId, setApprovingId] = useState<number | string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Compile Order state
  const [orderCourses, setOrderCourses] = useState<OrderableCourse[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);

  const loadData = async () => {
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
      if (d.length && !selectedDept) setSelectedDept(String(d[0].id));
      if (y.length && !selectedYear) setSelectedYear(String(y[0].id));
      if (t.length && !selectedTemplate) setSelectedTemplate(String(t[0].id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load publishing data");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      apiFetch<SchemeItem[]>(`/curriculum-schemes/?department_id=${encodeURIComponent(selectedDept)}`)
        .then((list) => {
          setSchemes(list);
          if (list.length > 0) {
            setSelectedScheme(list[0].id);
          } else {
            setSelectedScheme("");
          }
        })
        .catch(() => setSchemes([]));
    }
  }, [selectedDept]);

  // Load compile order courses whenever scheme or year_of_study changes
  useEffect(() => {
    if (!selectedScheme || !selectedYos) {
      setOrderCourses([]);
      return;
    }

    const semsMap: Record<string, [number, number]> = {
      FE: [1, 2],
      SE: [3, 4],
      TE: [5, 6],
      BE: [7, 8],
    };
    const sems = semsMap[selectedYos] || [1, 2];

    setLoadingOrder(true);
    Promise.all([
      apiFetch<any[]>(`/curriculum-schemes/${selectedScheme}/semesters/${sems[0]}/courses/`),
      apiFetch<any[]>(`/curriculum-schemes/${selectedScheme}/semesters/${sems[1]}/courses/`),
    ])
      .then(([s1Courses, s2Courses]) => {
        const combined: OrderableCourse[] = [
          ...(s1Courses || []).map((c: any) => ({ id: c.id, code: c.code, title: c.title })),
          ...(s2Courses || []).map((c: any) => ({ id: c.id, code: c.code, title: c.title })),
        ];
        setOrderCourses(combined);
      })
      .catch(() => setOrderCourses([]))
      .finally(() => setLoadingOrder(false));
  }, [selectedScheme, selectedYos]);

  const moveCourse = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orderCourses.length) return;
    const next = [...orderCourses];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setOrderCourses(next);
  };

  const handleSaveOrder = async () => {
    if (!selectedScheme || !selectedYos || orderCourses.length === 0) return;
    try {
      setSavingOrder(true);
      setError(null);
      await apiFetch(`/curriculum-schemes/${selectedScheme}/compile-order`, {
        method: "PUT",
        body: JSON.stringify({
          year_of_study: selectedYos,
          ordered_course_ids: orderCourses.map((c) => c.id),
        }),
      });
      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 3000);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to save compile order");
    } finally {
      setSavingOrder(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedDept || !selectedTemplate || !selectedYos || !versionLabel.trim()) return;
    setPublishing(true);
    setResult(null);
    setError(null);
    try {
      const payload: any = {
        department: selectedDept,
        template: selectedTemplate,
        year_of_study: selectedYos,
        version_label: versionLabel.trim(),
      };
      if (selectedScheme) {
        payload.scheme_id = selectedScheme;
      }
      if (selectedYear) {
        payload.academic_year = selectedYear;
      }

      const pub = await apiFetch<PublishedItem>("/published-curricula/publish/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(`Published successfully for ${selectedYos}! PDF booklet compiled.`);
      setPublished((prev) => [pub, ...prev]);
      const tmpls = await apiFetch<Template[] | { results: Template[] }>("/curriculum-templates/");
      setTemplates(Array.isArray(tmpls) ? tmpls : tmpls.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleApprove = async (id: number | string) => {
    setApprovingId(id);
    try {
      await apiFetch(`/published-curricula/${id}/hod-approve/`, { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  const activeTemplate = templates.find((t) => String(t.id) === selectedTemplate);

  return (
    <RoleGuard allowed={["HOD", "ADMIN"]}>
      <AppShell>
        <div className="space-y-10 max-w-5xl mx-auto animate-fade-in text-left">
          {/* Editorial Page Title */}
          <section className="space-y-2">
            <div className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">PDF Publisher</div>
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
              Syllabus Booklet Publisher
            </h1>
            <div className="w-12 h-0.5 bg-primary/40 my-2" />
            <p className="text-xs text-muted-foreground max-w-2xl font-medium leading-relaxed">
              Compile courses and syllabi into unified curriculum booklets by year of study (FE, SE, TE, BE). Once generated, published booklets are preserved in the curriculum archive.
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
                  Compile all approved course syllabus sections into an official academic curriculum booklet by year of study.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider">Department</span>
                <select 
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer font-serif" 
                  value={selectedDept} 
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  {departments.map((d) => <option key={d.id} value={d.id} className="bg-card text-foreground">{d.code} — {d.name}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider">Scheme / Session</span>
                <select 
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer" 
                  value={selectedScheme} 
                  onChange={(e) => setSelectedScheme(e.target.value)}
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id} className="bg-card text-foreground">
                      Scheme {s.entering_year} ({s.status})
                    </option>
                  ))}
                  {schemes.length === 0 && years.map((y) => (
                    <option key={y.id} value={y.id} className="bg-card text-foreground">
                      AY {y.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider">Year of Study</span>
                <select 
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer" 
                  value={selectedYos} 
                  onChange={(e) => setSelectedYos(e.target.value)}
                >
                  {YEAR_OF_STUDY_OPTIONS.map((y) => (
                    <option key={y.value} value={y.value} className="bg-card text-foreground">
                      {y.label} ({y.sems})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider">Layout Template</span>
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

            {/* Compile Order Reordering Panel */}
            {selectedScheme && orderCourses.length > 0 && (
              <div className="border border-border/80 rounded-sm bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-xs text-foreground uppercase tracking-wider">
                      Compile Order ({selectedYos} Detailed Syllabi)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      Arrange the sequence of subjects as they will appear in the compiled handbook.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {orderSaved && (
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Order Saved</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveOrder}
                      disabled={savingOrder}
                      className="h-7 text-[10px] font-bold"
                    >
                      {savingOrder ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Save Order
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {orderCourses.map((c, idx) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded bg-card border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] text-muted-foreground w-5">
                          {idx + 1}.
                        </span>
                        <span className="font-mono font-bold text-primary">{c.code}</span>
                        <span className="font-medium text-foreground">{c.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveCourse(idx, "up")}
                          disabled={idx === 0}
                          className="px-1.5 py-0.5 rounded text-xs hover:bg-muted disabled:opacity-30"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCourse(idx, "down")}
                          disabled={idx === orderCourses.length - 1}
                          className="px-1.5 py-0.5 rounded text-xs hover:bg-muted disabled:opacity-30"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                Assemble &amp; Compile {selectedYos} Booklet
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
                        {item.year_of_study && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border ${YOS_COLORS[item.year_of_study] ?? 'bg-muted'}`}>
                            {item.year_of_study}
                          </span>
                        )}
                        <span>Board Release Book Specification</span>
                      </div>
                      
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>COMPILATION: {new Date(item.created_at).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{item.render_metrics?.page_count ?? 0} PAGES</span>
                        <span>·</span>
                        <span>{item.render_metrics?.course_count ?? 0} SYLLABUSES</span>
                        {item.hod_approved_at ? (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ HOD APPROVED ({new Date(item.hod_approved_at).toLocaleDateString()})</span>
                          </>
                        ) : (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">PENDING HOD APPROVAL</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {!item.hod_approved_at && (user?.role === "HOD" || user?.role === "ADMIN") && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => void handleApprove(item.id)} 
                          disabled={approvingId === item.id}
                          className="h-8 text-[10px] font-bold uppercase tracking-wider border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                        >
                          {approvingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve as HOD"}
                        </Button>
                      )}

                      {item.pdf && (
                        <Button variant="secondary" asChild className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-sm border-border/60 hover:bg-muted">
                          <a href={item.pdf} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Download Booklet
                          </a>
                        </Button>
                      )}
                    </div>
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
    </RoleGuard>
  );
}
