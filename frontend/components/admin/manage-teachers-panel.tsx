"use client";

import { Loader2, Plus, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Teacher = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  department_id: string | null;
  is_active: boolean;
};

type Department = { id: string; name: string; code: string };

const teacherName = (t: Teacher) =>
  [t.first_name, t.last_name].filter(Boolean).join(" ").trim() || t.email;

export function ManageTeachersPanel({
  isHod,
  hodDepartmentId,
  hodDepartmentName,
}: {
  isHod: boolean;
  hodDepartmentId?: string | null;
  hodDepartmentName?: string;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filterDept, setFilterDept] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", department_id: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refreshTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const deptParam = isHod ? hodDepartmentId : filterDept;
      const qs = deptParam ? `?role=FACULTY&department_id=${deptParam}` : "?role=FACULTY";
      const list = await apiFetch<Teacher[]>("/profiles/faculty" + qs);
      setTeachers(Array.isArray(list) ? list : []);
    } catch {
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [isHod, hodDepartmentId, filterDept]);

  useEffect(() => {
    if (!isHod) {
      apiFetch<Department[]>("/departments/")
        .then((d) => setDepartments(Array.isArray(d) ? d : []))
        .catch(() => setDepartments([]));
    }
  }, [isHod]);

  useEffect(() => {
    void refreshTeachers();
  }, [refreshTeachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/teachers/", {
        method: "POST",
        body: JSON.stringify({ ...form, department_id: isHod ? hodDepartmentId : form.department_id }),
      });
      setForm({ name: "", email: "", password: "", department_id: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
      void refreshTeachers();
    } catch (err: any) {
      const message = err?.message ?? "";
      if (message.includes("EMAIL_EXISTS")) {
        setError("A teacher with this email already exists.");
      } else if (message.includes("PASSWORD_TOO_SHORT")) {
        setError("Password must be at least 8 characters.");
      } else {
        setError("Could not create teacher. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (t: Teacher) => {
    setTogglingId(t.id);
    try {
      await apiFetch(`/teachers/${t.id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !t.is_active }),
      });
      void refreshTeachers();
    } catch {
      alert("Failed to update teacher status.");
    } finally {
      setTogglingId(null);
    }
  };

  const deptName = (id: string | null) =>
    departments.find((d) => String(d.id) === String(id))?.name ?? id ?? "—";

  return (
    <div className="rounded border border-border bg-card p-6 shadow-sm space-y-6">
      <div className="border-b border-border/80 pb-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center text-primary">
          <UserPlus className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-serif font-bold text-foreground">Manage Teachers</h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Create teacher accounts and control who appears in subject-assignment dropdowns.
          </p>
        </div>
      </div>

      {/* Add teacher form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Full Name</span>
            <input
              type="text"
              required
              placeholder="e.g. Prof. Rohan Deshmukh"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Email</span>
            <input
              type="email"
              required
              placeholder="teacher@college.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Password</span>
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
            />
            <span className="block text-[10px] text-muted-foreground">At least 8 characters</span>
          </label>
          {isHod ? (
            <div className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Department</span>
              <div className="h-10 w-full flex items-center rounded-sm border border-border bg-muted/30 px-3 text-xs font-bold text-foreground">
                {hodDepartmentName || hodDepartmentId || "—"}
              </div>
            </div>
          ) : (
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">Department</span>
              <select
                required
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                className="h-10 w-full rounded-sm border border-border bg-background px-3 text-xs font-bold transition-all focus-visible:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-card text-foreground">
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && (
          <p className="rounded border border-rose-500/10 bg-rose-500/5 p-3 text-xs font-bold text-rose-600 leading-relaxed">{error}</p>
        )}
        {success && (
          <p className="rounded border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs font-bold text-emerald-600 leading-relaxed">
            Teacher account created successfully.
          </p>
        )}

        <Button type="submit" disabled={submitting} className="h-10 font-bold uppercase tracking-wider text-xs">
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
          Add Teacher
        </Button>
      </form>

      {/* Teacher list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80 font-mono">
            Teacher Accounts
          </h3>
          {!isHod && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="h-8 rounded-sm border border-border bg-background px-2 text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Email</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Department</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-[9px] text-muted-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs font-semibold text-muted-foreground">
                    Loading teachers...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs font-semibold text-muted-foreground">
                    No teachers yet — add one above.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="border-b border-border/40 last:border-b-0">
                    <td className="px-4 py-2.5 font-bold text-foreground">{teacherName(t)}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{t.email}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{deptName(t.department_id)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "rounded-sm px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider",
                          t.is_active
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                        )}
                      >
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={togglingId === t.id}
                        onClick={() => void handleToggle(t)}
                        className={cn(
                          "h-7 px-2.5 text-[9px] font-bold uppercase tracking-wider border",
                          t.is_active
                            ? "text-rose-600 hover:bg-rose-500/10 border-transparent hover:border-rose-500/20"
                            : "text-emerald-600 hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20"
                        )}
                      >
                        {togglingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : t.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
