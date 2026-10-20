"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { painelNav } from "./nav";

export function PainelNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="flex gap-1 overflow-x-auto lg:flex-col">
      {painelNav.map((item) => {
        const active =
          item.href === "/painel" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "bg-brand-50 text-brand-800" : "text-ink-600 hover:bg-ink-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
