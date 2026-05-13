import { AppShell } from "@/components/layout/app-shell";

export default function AdminPage() {
  return (
    <AppShell>
      <div className="grid gap-4 md:grid-cols-3">
        {["Academic Years", "Departments", "Semesters", "Faculty Assignment", "Templates", "Audit Logs"].map((item) => (
          <section key={item} className="rounded-md border border-border p-4">
            <h2 className="font-semibold">{item}</h2>
            <p className="mt-2 text-sm text-foreground/60">Administrative management surface.</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
