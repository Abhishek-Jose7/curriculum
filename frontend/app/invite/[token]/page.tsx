import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <section className="mx-auto mt-12 max-w-xl rounded-md border border-border p-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Subject Curriculum Invitation</h1>
        </div>
        <p className="mt-4 text-sm text-foreground/70">
          This link gives a teacher access to one assigned subject only. After signing in, the teacher accepts the invite and lands directly in the structured Course Editor for that subject.
        </p>
        <div className="mt-4 rounded-md bg-muted p-3 text-sm">
          Invitation token: <span className="font-mono">{token}</span>
        </div>
        <div className="mt-5 flex gap-2">
          <Button asChild><Link href="/courses/1">Open Assigned Subject</Link></Button>
          <Button variant="secondary" asChild><Link href="/">Go to Editor</Link></Button>
        </div>
      </section>
    </main>
  );
}
