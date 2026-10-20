import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Marca: bloco de horário (a "ficha" âmbar) ao lado do nome. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-8 place-items-center rounded-[10px] bg-brand-700 shadow-soft",
        className,
      )}
    >
      <span className="absolute top-1.5 left-1.5 h-1 w-3 rounded-full bg-white/40" />
      <span className="absolute right-1.5 bottom-1.5 left-1.5 h-2.5 rounded-[4px] bg-amber-400" />
    </span>
  );
}

export function Brand({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 font-display text-[17px] font-semibold tracking-tight",
        light ? "text-white" : "text-ink-900",
      )}
    >
      <BrandMark />
      Agenda Autônomo
    </Link>
  );
}
