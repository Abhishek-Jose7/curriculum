import { cn } from "@/lib/utils";

const tones: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: {
    bg: "bg-zinc-500/5",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-500/20"
  },
  SUBMITTED: {
    bg: "bg-blue-500/5",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20"
  },
  UNDER_REVIEW: {
    bg: "bg-amber-500/5",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20"
  },
  CHANGES_REQUESTED: {
    bg: "bg-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20"
  },
  APPROVED: {
    bg: "bg-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20"
  },
  PUBLISHED: {
    bg: "bg-teal-500/5",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/20"
  },
  LOCKED: {
    bg: "bg-purple-500/5",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20"
  }
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = tones[status] ?? tones.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-all",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
