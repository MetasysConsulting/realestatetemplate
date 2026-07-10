import { Inbox } from "lucide-react";
import { cn } from "@/lib/admin/utils";

type AdminEmptyStateProps = {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
};

export function AdminEmptyState({
  title = "No data yet",
  description = "This section will populate once live data is connected.",
  className,
  compact = false,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-white/15 bg-white/[0.02]",
        compact ? "px-4 py-8 gap-2" : "px-6 py-14 gap-3",
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/40">
        <Inbox className="h-5 w-5" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-semibold text-white/85">{title}</p>
        <p className="text-sm text-white/45 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
