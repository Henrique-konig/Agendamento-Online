import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Marca: cartão de agenda com a "ficha" âmbar confirmada (mesmo desenho do ícone do app). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 512 512"
      className={cn("size-8 shrink-0 rounded-[10px] shadow-soft", className)}
    >
      <rect width="512" height="512" rx="116" fill="#0f6a6e" />
      <rect x="104" y="100" width="168" height="56" rx="28" fill="#fff" fillOpacity="0.38" />
      <rect x="104" y="196" width="304" height="216" rx="60" fill="#f6b93b" />
      <path
        d="M190 306l46 46 90-92"
        fill="none"
        stroke="#0a4144"
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Brand({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 font-display text-[17px] font-semibold tracking-tight whitespace-nowrap",
        light ? "text-white" : "text-ink-900",
      )}
    >
      <BrandMark />
      {/* Em telas bem estreitas (iPhone SE) fica só o ícone. */}
      <span className="max-[359px]:sr-only">Agenda Autônomo</span>
    </Link>
  );
}
