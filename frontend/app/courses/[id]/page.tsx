import { AppShell } from "@/components/layout/app-shell";
import { CurriculumEditor } from "@/components/curriculum/curriculum-editor";

export default async function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <CurriculumEditor courseId={Number(id)} />
    </AppShell>
  );
}
