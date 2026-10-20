import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-ink-900">
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white"
      >
        A
      </span>
      Agenda Autônomo
    </Link>
  );
}
