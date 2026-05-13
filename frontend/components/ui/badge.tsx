import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  SUBMITTED: "bg-sky-100 text-sky-800",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  CHANGES_REQUESTED: "bg-rose-100 text-rose-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  PUBLISHED: "bg-teal-100 text-teal-800",
  LOCKED: "bg-zinc-800 text-white"
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("rounded px-2 py-1 text-xs font-semibold", tones[status] ?? tones.DRAFT, className)}>{status.replaceAll("_", " ")}</span>;
}
