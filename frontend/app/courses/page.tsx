import Link from "next/link";
import { Eye, FileSearch } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const courses = [
  { id: 1, code: "CS301", title: "Data Structures and Algorithms", faculty: "Dr. Meera Sharma", status: "UNDER_REVIEW", lastModified: "2026-05-13 18:40", validation: "Warnings", missing: "CO mapping, Module 2 detail" },
  { id: 2, code: "CS352", title: "Database Management Systems Lab", faculty: "Prof. Iqbal Khan", status: "DRAFT", lastModified: "2026-05-12 11:15", validation: "Incomplete", missing: "Experiments, References" },
  { id: 3, code: "CS415", title: "Machine Learning", faculty: "Dr. Radhika Iyer", status: "APPROVED", lastModified: "2026-05-10 16:05", validation: "Clear", missing: "None" }
];

export default function CoursesPage() {
  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Curriculum Workflow Queue</h2>
          <p className="text-sm text-foreground/60">Track authoring completeness, validation, preview, and review readiness.</p>
        </div>
        <Button>Create Structured Course</Button>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-3 py-3">Course Code</th>
              <th className="px-3 py-3">Course Name</th>
              <th className="px-3 py-3">Faculty Assigned</th>
              <th className="px-3 py-3">Workflow Status</th>
              <th className="px-3 py-3">Last Modified</th>
              <th className="px-3 py-3">Validation Status</th>
              <th className="px-3 py-3">Missing Sections</th>
              <th className="px-3 py-3">Preview Action</th>
              <th className="px-3 py-3">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-muted/45">
                <td className="px-3 py-3 font-mono">{course.code}</td>
                <td className="px-3 py-3 font-medium"><Link href={`/courses/${course.id}`}>{course.title}</Link></td>
                <td className="px-3 py-3">{course.faculty}</td>
                <td className="px-3 py-3"><StatusBadge status={course.status} /></td>
                <td className="px-3 py-3">{course.lastModified}</td>
                <td className="px-3 py-3">{course.validation}</td>
                <td className="px-3 py-3">{course.missing}</td>
                <td className="px-3 py-3"><Button variant="secondary" asChild><Link href={`/courses/${course.id}`}><Eye className="h-4 w-4" />Preview</Link></Button></td>
                <td className="px-3 py-3"><Button variant="secondary" asChild><Link href="/review"><FileSearch className="h-4 w-4" />Review</Link></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
