"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";
import { apiFetch } from "@/lib/api";
import type { CurriculumScheme, YearOfStudy } from "@/types/scheme";
import { PAIR_SEMESTERS } from "@/types/scheme";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Unlock,
  Lock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import "@/styles/scheme-authoring-tokens.css";

const PAIRS: Array<{ key: YearOfStudy; label: string; name: string; sems: [number, number] }> = [
  { key: "FE", label: "First Year (FE)", name: "Semesters 1 & 2", sems: [1, 2] },
  { key: "SE", label: "Second Year (SE)", name: "Semesters 3 & 4", sems: [3, 4] },
  { key: "TE", label: "Third Year (TE)", name: "Semesters 5 & 6", sems: [5, 6] },
  { key: "BE", label: "Final Year (BE)", name: "Semesters 7 & 8", sems: [7, 8] },
];

export default function SchemeUnlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [scheme, setScheme] = useState<CurriculumScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockingKey, setUnlockingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadScheme();
  }, [id]);

  async function loadScheme() {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch<CurriculumScheme>(`/curriculum-schemes/${id}/`);
      setScheme(data);
    } catch (err: any) {
      setError(err.message || "Failed to load scheme.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlockPair(pairKey: YearOfStudy) {
    try {
      setUnlockingKey(pairKey);
      setError("");
      setSuccess("");

      await apiFetch(`/curriculum-schemes/${id}/unlock-pair`, {
        method: "POST",
        body: JSON.stringify({ year_of_study: pairKey }),
      });

      setSuccess(`Successfully unlocked ${pairKey} semesters.`);
      await loadScheme();
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.detail || parsed.error || "Failed to unlock semester pair.");
      } catch {
        setError(err.message || "Failed to unlock semester pair.");
      }
    } finally {
      setUnlockingKey(null);
    }
  }

  function getPairState(pair: (typeof PAIRS)[0]) {
    if (!scheme?.semesters) return { unlocked: false, canUnlock: false, reason: "" };

    const sem1 = scheme.semesters.find((s) => s.number === pair.sems[0]);
    const sem2 = scheme.semesters.find((s) => s.number === pair.sems[1]);

    const isUnlocked = Boolean(sem1?.is_unlocked && sem2?.is_unlocked);
    if (isUnlocked) {
      return { unlocked: true, canUnlock: false, reason: "Already unlocked for faculty authoring." };
    }

    // Check prior pair prerequisite (e.g. SE requires FE unlocked)
    if (pair.key === "SE") {
      const fe1 = scheme.semesters.find((s) => s.number === 1);
      const fe2 = scheme.semesters.find((s) => s.number === 2);
      if (!fe1?.is_unlocked || !fe2?.is_unlocked) {
        return { unlocked: false, canUnlock: false, reason: "FE (Sem 1–2) must be unlocked first." };
      }
    } else if (pair.key === "TE") {
      const se1 = scheme.semesters.find((s) => s.number === 3);
      const se2 = scheme.semesters.find((s) => s.number === 4);
      if (!se1?.is_unlocked || !se2?.is_unlocked) {
        return { unlocked: false, canUnlock: false, reason: "SE (Sem 3–4) must be unlocked first." };
      }
    } else if (pair.key === "BE") {
      const te1 = scheme.semesters.find((s) => s.number === 5);
      const te2 = scheme.semesters.find((s) => s.number === 6);
      if (!te1?.is_unlocked || !te2?.is_unlocked) {
        return { unlocked: false, canUnlock: false, reason: "TE (Sem 5–6) must be unlocked first." };
      }
    }

    // Check if both semesters in this pair have subjects
    if (!sem1 || sem1.course_count === 0 || !sem2 || sem2.course_count === 0) {
      return {
        unlocked: false,
        canUnlock: false,
        reason: `Both Sem ${pair.sems[0]} and Sem ${pair.sems[1]} must have subjects created first.`,
      };
    }

    return { unlocked: false, canUnlock: true, reason: "" };
  }

  if (loading) {
    return (
      <RoleGuard allowed={["ADMIN", "HOD"]}>
        <AppShell>
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#A6763A]" />
          </div>
        </AppShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowed={["ADMIN", "HOD"]}>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 sa-container p-4 sm:p-6 rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 sa-border">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/schemes/${id}/author`)}
                className="h-8 px-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Authoring
              </Button>
              <div className="h-4 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold sa-display flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-[#A6763A]" /> Semester Unlock Console
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Cohort {scheme?.entering_year} • Multi-cohort progressive semester release
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/schemes/${id}/author`)}
              className="text-xs"
            >
              Back to Authoring <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {error && (
            <div className="p-3 text-sm rounded border border-red-200 bg-red-50 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 text-sm rounded border border-green-200 bg-green-50 text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Info Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border sa-border text-xs space-y-1.5" style={{ color: "var(--sa-slate)" }}>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">Progressive Cohort Release Rules:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All 8 semester shells can be authored and completed at any time.</li>
              <li>Unlocking releases the semester pair to faculty for detailed syllabus authoring and reviewer commenting.</li>
              <li>Unlocking occurs pair-by-pair: FE (1–2) → SE (3–4) → TE (5–6) → BE (7–8).</li>
            </ul>
          </div>

          {/* Pair Cards */}
          <div className="space-y-4">
            {PAIRS.map((pair) => {
              const state = getPairState(pair);
              const sem1 = scheme?.semesters?.find((s) => s.number === pair.sems[0]);
              const sem2 = scheme?.semesters?.find((s) => s.number === pair.sems[1]);

              return (
                <div
                  key={pair.key}
                  className={`p-5 rounded-lg border sa-border bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    state.unlocked
                      ? "border-l-4 border-l-[#2F6B4F]"
                      : state.canUnlock
                      ? "border-l-4 border-l-[#A6763A]"
                      : "border-l-4 border-l-zinc-300 dark:border-l-zinc-700 opacity-80"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-base px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                        {pair.key}
                      </span>
                      <h3 className="font-bold text-base sa-display">{pair.name}</h3>
                      {state.unlocked ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-zinc-100 text-zinc-600 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>

                    {/* Semester status indicators */}
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Sem {pair.sems[0]}:</span>
                        <span className="font-semibold">{sem1?.course_count || 0} subjects</span>
                        {sem1?.shell_completed_at && (
                          <span className="text-[10px] text-[#2F6B4F] flex items-center gap-0.5">
                            (Shell Complete)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Sem {pair.sems[1]}:</span>
                        <span className="font-semibold">{sem2?.course_count || 0} subjects</span>
                        {sem2?.shell_completed_at && (
                          <span className="text-[10px] text-[#2F6B4F] flex items-center gap-0.5">
                            (Shell Complete)
                          </span>
                        )}
                      </div>
                    </div>

                    {!state.unlocked && state.reason && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1 pt-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>{state.reason}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    {state.unlocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-xs border-[#2F6B4F] text-[#2F6B4F]"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!state.canUnlock || unlockingKey === pair.key}
                        onClick={() => handleUnlockPair(pair.key)}
                        className="text-xs bg-[#1B2430] hover:bg-[#2A374A] text-white"
                      >
                        {unlockingKey === pair.key ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 mr-1" />
                        )}
                        Unlock {pair.key} (Sem {pair.sems[0]}–{pair.sems[1]})
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AppShell>
    </RoleGuard>
  );
}
