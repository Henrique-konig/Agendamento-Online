import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "info" | "success" | "error" | "warning";

const tones: Record<Tone, string> = {
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  success: "bg-brand-50 text-brand-800 ring-brand-200",
  error: "bg-red-50 text-red-800 ring-red-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg px-4 py-3 text-sm ring-1 ring-inset", tones[tone])}
    >
      {children}
    </div>
  );
}

export function FormMessage({ ok, message }: { ok?: boolean; message?: string }) {
  if (!message) return null;
  return <Alert tone={ok ? "success" : "error"}>{message}</Alert>;
}
