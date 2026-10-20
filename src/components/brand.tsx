import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-ink-900 flex items-center gap-2 font-semibold">
      <span
        aria-hidden
        className="bg-brand-600 grid size-8 place-items-center rounded-lg text-sm font-bold text-white"
      >
        A
      </span>
      Agenda Autônomo
    </Link>
  );
}
