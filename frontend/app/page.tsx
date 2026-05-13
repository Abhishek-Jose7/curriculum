import { AppShell } from "@/components/layout/app-shell";
import { CurriculumEditor } from "@/components/curriculum/curriculum-editor";

export default function HomePage() {
  return (
    <AppShell>
      <CurriculumEditor courseId={1} />
    </AppShell>
  );
}
