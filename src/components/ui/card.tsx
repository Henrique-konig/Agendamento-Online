import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("ring-ink-200/70 rounded-2xl bg-white p-6 shadow-xs ring-1", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-ink-900 text-base font-semibold">{title}</h2>
        {description ? <p className="text-ink-500 mt-1 text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
