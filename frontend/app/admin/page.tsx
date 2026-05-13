import { AppShell } from "@/components/layout/app-shell";
import { InviteTeacherPanel } from "@/components/admin/invite-teacher-panel";

export default function AdminPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <InviteTeacherPanel />
        <section className="rounded-md border border-border p-4">
          <h2 className="font-semibold">Admin Operating Order</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/75">
            <li>Create academic year, department, semester, and course shell.</li>
            <li>Invite the assigned teacher by email from this page.</li>
            <li>Teacher opens the subject link, accepts it, and edits only that assigned course.</li>
            <li>Admin/HOD monitors validation, preview, review comments, and final PDF publish.</li>
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
