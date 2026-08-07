"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context";
import {
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  BookOpen,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublishedCurriculum {
  id: number;
  department_id?: number;
  academic_year_id?: number;
  year_of_study?: string;
  version_label?: string;
  pdf_url?: string;
  print_url?: string;
  hod_approved_at?: string | null;
  hod_approved_by?: number | string | null;
  is_public?: boolean;
  academic_year_name?: string;
  department_name?: string;
  department_code?: string;
  render_metrics?: string | Record<string, any> | null;
}

const YOS_COLORS: Record<string, string> = {
  FE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  SE: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  TE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  BE: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
};

const YOS_LABELS: Record<string, string> = {
  FE: "First Year",
  SE: "Second Year",
  TE: "Third Year",
  BE: "Final Year",
};

const YOS_OPTIONS = [
  { key: "all", label: "All Levels" },
  { key: "FE", label: "FE — First Year" },
  { key: "SE", label: "SE — Second Year" },
  { key: "TE", label: "TE — Third Year" },
  { key: "BE", label: "BE — Final Year" },
];

function parseRenderMetrics(metrics: string | Record<string, any> | null | undefined): Record<string, any> | null {
  if (!metrics) return null;
  if (typeof metrics === "object") return metrics;
  if (typeof metrics === "string") {
    try {
      return JSON.parse(metrics);
    } catch {
      return null;
    }
  }
  return null;
}

function RenderMetricsBadge({ metrics }: { metrics: string | Record<string, any> | null | undefined }) {
  const parsed = parseRenderMetrics(metrics);
  const rawStatus = (parsed?.status || parsed?.render_status || "completed").toString().toLowerCase();

  if (rawStatus === "completed" || rawStatus === "done" || rawStatus === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20 uppercase tracking-wider">
        <CheckCircle2 className="h-3 w-3" /> Render: Completed
      </span>
    );
  }

  if (rawStatus === "processing" || rawStatus === "rendering") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-sm border border-amber-500/20 uppercase tracking-wider">
        <Clock className="h-3 w-3 animate-spin text-amber-500" /> Render: Processing
      </span>
    );
  }

  if (rawStatus === "queued" || rawStatus === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-sm border border-blue-500/20 uppercase tracking-wider">
        <Clock className="h-3 w-3 text-blue-500" /> Render: Queued
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border uppercase tracking-wider">
      <Clock className="h-3 w-3" /> Render: {rawStatus}
    </span>
  );
}

export default function ArchivePage() {
  const { user } = useAuth();
  const [curricula, setCurricula] = useState<PublishedCurriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [yosFilter, setYosFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    apiFetch<PublishedCurriculum[] | { results: PublishedCurriculum[] }>("/published-curricula/archive/")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results ?? [];
        setCurricula(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const academicYears = [...new Set(curricula.map((c) => c.academic_year_name).filter(Boolean) as string[])].sort().reverse();

  const filtered = curricula
    .filter((c) => yosFilter === "all" || c.year_of_study === yosFilter)
    .filter((c) => yearFilter === "all" || c.academic_year_name === yearFilter);

  const groupedByYear = filtered.reduce<Record<string, PublishedCurriculum[]>>((acc, item) => {
    const yearKey = item.academic_year_name || "Unassigned Academic Year";
    if (!acc[yearKey]) acc[yearKey] = [];
    acc[yearKey].push(item);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedByYear).sort().reverse();

  return (
    <AppShell>
      <RoleGuard allowed={["HOD", "ADMIN"]}>
        <div className="space-y-8 max-w-6xl mx-auto animate-fade-in text-left">
          {/* Editorial Page Header */}
          <section className="space-y-2">
            <div className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">
              REPOSITORIUM &amp; HISTORICAL LEDGER
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <Archive className="h-6 w-6 text-primary shrink-0" />
              Curriculum Archive &amp; Register
            </h1>
            <div className="w-12 h-0.5 bg-primary/40 my-2" />
            <p className="text-xs text-muted-foreground max-w-2xl font-medium leading-relaxed">
              Browse, filter, and access historical published academic curricula across departments and study years.
            </p>
          </section>

          {/* Filter Bar */}
          <section className="rounded-sm border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-4">
              {/* Year of Study Filter Tabs */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="h-3 w-3 text-primary" /> Year of Study Level
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {YOS_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setYosFilter(opt.key)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold font-mono transition-all rounded-sm border",
                        yosFilter === opt.key
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-secondary/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Academic Year Filter Dropdown */}
              {user?.role === "ADMIN" && (
                <div className="space-y-1.5 shrink-0 min-w-[200px]">
                  <span className="text-[10px] font-mono font-bold text-foreground/75 uppercase tracking-wider block">
                    Academic Year Session
                  </span>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="h-9 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold font-mono transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  >
                    <option value="all">All Academic Years ({academicYears.length})</option>
                    {academicYears.map((ay) => (
                      <option key={ay} value={ay}>
                        {ay}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>
                Showing <strong className="text-foreground">{filtered.length}</strong> of{" "}
                <strong className="text-foreground">{curricula.length}</strong> registered documents
              </span>
              {(yosFilter !== "all" || yearFilter !== "all") && (
                <button
                  onClick={() => {
                    setYosFilter("all");
                    setYearFilter("all");
                  }}
                  className="text-xs text-primary font-bold hover:underline font-mono"
                >
                  Reset filters
                </button>
              )}
            </div>
          </section>

          {/* Main Content List / Loading / Empty State */}
          {loading ? (
            <div className="py-20 text-center space-y-3 border border-border rounded-sm bg-card/30">
              <Loader2 className="h-7 w-7 animate-spin text-primary mx-auto" />
              <p className="text-xs font-serif font-semibold text-muted-foreground">
                Retrieving published curricula register...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs font-serif italic text-muted-foreground/70 border border-dashed border-border/80 rounded-sm bg-card/20 space-y-2">
              <Archive className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p>No published curricula match the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedGroupKeys.map((academicYearName) => {
                const items = groupedByYear[academicYearName];
                return (
                  <section key={academicYearName} className="space-y-3">
                    {/* Academic Year Header */}
                    <div className="border-b border-border/80 pb-2 flex items-center justify-between">
                      <h2 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                        <BookOpen className="h-4.5 w-4.5 text-primary" />
                        Academic Session: {academicYearName}
                      </h2>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border/60">
                        {items.length} {items.length === 1 ? "Curriculum" : "Curricula"}
                      </span>
                    </div>

                    {/* Card List */}
                    <div className="border border-border rounded-sm bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                      {items.map((item) => {
                        const yosKey = item.year_of_study || "FE";
                        const yosBadgeClass = YOS_COLORS[yosKey] || "bg-muted text-muted-foreground border-border";
                        const yosLabel = YOS_LABELS[yosKey] || yosKey;

                        return (
                          <div
                            key={item.id}
                            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-secondary/10 transition-colors group"
                          >
                            {/* Information Block */}
                            <div className="space-y-2.5 flex-1 min-w-0">
                              {/* Header row: Dept + YOS badge + Version */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-serif font-bold text-sm text-foreground">
                                  {item.department_code ? `${item.department_code} — ` : ""}
                                  {item.department_name || "Department"}
                                </span>

                                <span
                                  className={cn(
                                    "px-2 py-0.5 text-[10px] font-mono font-bold border rounded-sm uppercase tracking-wider",
                                    yosBadgeClass
                                  )}
                                >
                                  {yosKey} ({yosLabel})
                                </span>

                                {item.version_label && (
                                  <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded-sm text-foreground/80 border border-border/70 font-bold uppercase tracking-wider">
                                    {item.version_label}
                                  </span>
                                )}
                              </div>

                              {/* Details row: Academic year, status badges */}
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/90">
                                  Session: {item.academic_year_name || academicYearName}
                                </span>

                                <span className="text-border">·</span>

                                {/* HOD Approval Status Chip */}
                                {item.hod_approved_at ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    HOD Approved ({new Date(item.hod_approved_at).toLocaleDateString()})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-sm border border-border/70">
                                    <AlertCircle className="h-3 w-3 opacity-60" />
                                    Pending Approval
                                  </span>
                                )}

                                <span className="text-border">·</span>

                                {/* Render metrics status */}
                                <RenderMetricsBadge metrics={item.render_metrics} />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                              {item.print_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-sm shrink-0 border-border hover:bg-muted"
                                >
                                  <a href={item.print_url} target="_blank" rel="noopener noreferrer">
                                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Preview
                                  </a>
                                </Button>
                              )}

                              {item.pdf_url && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  asChild
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-sm shrink-0 border-border hover:bg-muted"
                                >
                                  <a href={item.pdf_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </RoleGuard>
    </AppShell>
  );
}
