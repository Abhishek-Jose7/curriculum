"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Save,
  Loader2,
  CheckCircle,
  Building2,
} from "lucide-react";
import "@/styles/scheme-authoring-tokens.css";

interface Department {
  id: string;
  code: string;
  name: string;
  college_name: string;
  university_name: string;
}

export default function DepartmentPreamblePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [department, setDepartment] = useState<Department | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [dept, preambleData] = await Promise.all([
          apiFetch<Department>(`/departments/${id}/`),
          apiFetch<{ department_id: string; content: string }>(`/departments/${id}/preamble/`),
        ]);
        setDepartment(dept);
        setContent(preambleData.content || "");
      } catch (err: any) {
        setError(err.message || "Failed to load department preamble.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSavedSuccess(false);

      await apiFetch(`/departments/${id}/preamble/`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.detail || parsed.error || "Failed to save preamble.");
      } catch {
        setError(err.message || "Failed to save preamble.");
      }
    } finally {
      setSaving(false);
    }
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
                onClick={() => router.back()}
                className="h-8 px-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="h-4 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-bold sa-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#A6763A]" /> Department Preamble
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {department ? `${department.name} (${department.code})` : "Autonomous Department Preamble"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="text-xs bg-[#1B2430] hover:bg-[#2A374A] text-white gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Preamble
            </Button>
          </div>

          {error && (
            <div className="p-3 text-sm rounded border border-red-200 bg-red-50 text-red-700">
              {error}
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 text-sm rounded border border-green-200 bg-green-50 text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Preamble saved successfully.</span>
            </div>
          )}

          {/* Editor Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border sa-border rounded-lg p-5 space-y-3 shadow-sm">
              <label className="block text-sm font-semibold" style={{ color: "var(--sa-ink)" }}>
                Preamble, Vision & Mission Content
              </label>
              <p className="text-xs" style={{ color: "var(--sa-slate)" }}>
                This institutional statement is included on the front pages of published curriculum handbooks for this department.
              </p>
              <textarea
                rows={16}
                className="w-full border rounded-md p-3.5 text-sm font-serif leading-relaxed sa-border bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#A6763A]"
                placeholder="Enter vision, mission, and autonomous preamble statements for this department..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#1B2430] hover:bg-[#2A374A] text-white"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </AppShell>
    </RoleGuard>
  );
}
