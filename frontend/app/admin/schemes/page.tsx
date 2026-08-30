"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";
import { useAuth } from "@/context";
import { apiFetch } from "@/lib/api";
import type { CurriculumScheme } from "@/types/scheme";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Plus,
  Loader2,
  Calendar,
  Building2,
  ArrowRight,
  Lock,
  Unlock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import "@/styles/scheme-authoring-tokens.css";

interface Department {
  id: string;
  code: string;
  name: string;
}

export default function AdminSchemesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<CurriculumScheme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEnteringYear, setNewEnteringYear] = useState("");
  const [duplicateFromId, setDuplicateFromId] = useState("");
  const [createDeptId, setCreateDeptId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const depts = await apiFetch<Department[]>("/departments/");
        setDepartments(depts);

        let initialDeptId = "";
        if (user?.role === "HOD" && user.department_id) {
          initialDeptId = user.department_id;
        } else if (depts.length > 0) {
          initialDeptId = depts[0].id;
        }
        setSelectedDeptId(initialDeptId);
        setCreateDeptId(initialDeptId);

        if (initialDeptId) {
          const list = await apiFetch<CurriculumScheme[]>(`/curriculum-schemes/?department_id=${encodeURIComponent(initialDeptId)}`);
          setSchemes(list);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load curriculum schemes.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  async function handleDeptChange(deptId: string) {
    setSelectedDeptId(deptId);
    try {
      setLoading(true);
      const list = await apiFetch<CurriculumScheme[]>(`/curriculum-schemes/?department_id=${encodeURIComponent(deptId)}`);
      setSchemes(list);
    } catch (err: any) {
      setError(err.message || "Failed to load schemes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateScheme(e: React.FormEvent) {
    e.preventDefault();
    if (!newEnteringYear.trim()) {
      setCreateError("Entering year is required (e.g. 2026-27).");
      return;
    }
    const deptId = user?.role === "HOD" ? user.department_id : createDeptId;
    if (!deptId) {
      setCreateError("Department is required.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");
      const payload: any = {
        department_id: deptId,
        entering_year: newEnteringYear.trim(),
      };
      if (duplicateFromId) {
        payload.duplicate_from_scheme_id = duplicateFromId;
      }

      const created = await apiFetch<CurriculumScheme>("/curriculum-schemes/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setIsCreateOpen(false);
      router.push(`/admin/schemes/${created.id}/author`);
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setCreateError(parsed.detail || parsed.error || "Failed to create scheme.");
      } catch {
        setCreateError(err.message || "Failed to create scheme.");
      }
    } finally {
      setCreating(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "rgba(166, 118, 58, 0.15)", color: "var(--sa-brass)" }}
          >
            <Unlock className="w-3 h-3 mr-1" /> Active
          </span>
        );
      case "completed":
        return (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "rgba(47, 107, 79, 0.15)", color: "var(--sa-confirm)" }}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </span>
        );
      default:
        return (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800"
            style={{ color: "var(--sa-slate)" }}
          >
            <Lock className="w-3 h-3 mr-1" /> Draft Setup
          </span>
        );
    }
  }

  const currentDept = departments.find((d) => d.id === selectedDeptId);

  return (
    <RoleGuard allowed={["ADMIN", "HOD"]}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 sa-container p-4 sm:p-6 rounded-lg">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 sa-border">
            <div>
              <h1 className="text-2xl font-bold sa-display flex items-center gap-2">
                <Layers className="w-6 h-6 text-[#A6763A]" /> Curriculum Schemes
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--sa-slate)" }}>
                Manage 8-semester institutional curriculum schemes by cohort entering year.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user?.role === "ADMIN" && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: "var(--sa-slate)" }} />
                  <select
                    className="border rounded px-3 py-1.5 text-sm bg-white dark:bg-zinc-900 sa-border"
                    value={selectedDeptId}
                    onChange={(e) => handleDeptChange(e.target.value)}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedDeptId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/departments/${selectedDeptId}/preamble`)}
                  className="gap-1.5"
                >
                  <FileText className="w-4 h-4" /> Preamble
                </Button>
              )}

              <Button
                onClick={() => {
                  setNewEnteringYear("");
                  setDuplicateFromId("");
                  setCreateDeptId(selectedDeptId);
                  setCreateError("");
                  setIsCreateOpen(true);
                }}
                className="gap-2 bg-[#1B2430] hover:bg-[#2A374A] text-white"
              >
                <Plus className="w-4 h-4" /> New Scheme
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm rounded border border-red-200 bg-red-50 text-red-700">
              {error}
            </div>
          )}

          {/* Department banner */}
          {currentDept && (
            <div className="flex items-center justify-between p-4 rounded bg-white dark:bg-zinc-900 border sa-border">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider" style={{ color: "var(--sa-slate)" }}>
                  Department
                </span>
                <div className="text-lg font-bold">
                  {currentDept.name} <span className="sa-mono text-sm font-normal text-slate-500">({currentDept.code})</span>
                </div>
              </div>
              <div className="text-sm" style={{ color: "var(--sa-slate)" }}>
                {schemes.length} {schemes.length === 1 ? "scheme" : "schemes"} configured
              </div>
            </div>
          )}

          {/* Scheme list */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#A6763A]" />
            </div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded border sa-border">
              <Calendar className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <h3 className="font-semibold text-lg">No curriculum schemes yet</h3>
              <p className="text-sm mt-1 mb-4" style={{ color: "var(--sa-slate)" }}>
                Create the first 8-semester curriculum scheme for this department.
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-[#1B2430] hover:bg-[#2A374A] text-white"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Scheme
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {schemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="bg-white dark:bg-zinc-900 border sa-border rounded-lg p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" style={{ color: "var(--sa-brass)" }} />
                        <span className="font-bold text-lg sa-mono">{scheme.entering_year}</span>
                      </div>
                      {getStatusBadge(scheme.status)}
                    </div>
                    <div className="text-xs space-y-1" style={{ color: "var(--sa-slate)" }}>
                      <div>Scheme Code Prefix: <span className="sa-mono font-semibold">{scheme.scheme_year_code}</span></div>
                      <div>Created: {new Date(scheme.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t sa-border flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/schemes/${scheme.id}/unlock`)}
                      className="text-xs"
                    >
                      <Unlock className="w-3.5 h-3.5 mr-1" /> Unlocks
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/admin/schemes/${scheme.id}/author`)}
                      className="text-xs bg-[#1B2430] hover:bg-[#2A374A] text-white"
                    >
                      Author Scheme <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Scheme Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-md w-full p-6 border sa-border shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3 sa-border">
                  <h3 className="font-bold text-lg sa-display">Create Curriculum Scheme</h3>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="text-gray-400 hover:text-gray-600 font-mono text-lg"
                  >
                    ×
                  </button>
                </div>

                {createError && (
                  <div className="p-2.5 text-xs rounded border border-red-200 bg-red-50 text-red-700">
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreateScheme} className="space-y-4">
                  {user?.role === "ADMIN" && (
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "var(--sa-slate)" }}>
                        Department
                      </label>
                      <select
                        className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-zinc-900 sa-border"
                        value={createDeptId}
                        onChange={(e) => setCreateDeptId(e.target.value)}
                        required
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code} — {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--sa-slate)" }}>
                      Entering Academic Year (e.g. 2026-27)
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 text-sm sa-mono sa-border bg-white dark:bg-zinc-900"
                      placeholder="2026-27"
                      value={newEnteringYear}
                      onChange={(e) => setNewEnteringYear(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--sa-slate)" }}>
                      Start From (Optional Shell Clone)
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-zinc-900 sa-border"
                      value={duplicateFromId}
                      onChange={(e) => setDuplicateFromId(e.target.value)}
                    >
                      <option value="">Blank (New 8 Semesters)</option>
                      {schemes.map((s) => (
                        <option key={s.id} value={s.id}>
                          Clone shell from {s.entering_year} ({s.status})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs mt-1" style={{ color: "var(--sa-slate)" }}>
                      Cloning copies subject shells and teaching components with updated year code prefixes.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t sa-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-[#1B2430] hover:bg-[#2A374A] text-white"
                    >
                      {creating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                      Create Scheme
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </RoleGuard>
  );
}
