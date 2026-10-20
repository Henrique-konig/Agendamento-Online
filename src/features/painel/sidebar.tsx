"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import { painelNav } from "./nav";

export function PainelNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Painel"
      className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0"
    >
      {painelNav.map((group, index) => (
        <div key={group.label ?? index} className="flex gap-1 lg:flex-col">
          {group.label ? (
            <p className="mb-1 hidden px-3 font-mono text-[10px] tracking-widest text-ink-400 uppercase lg:block">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => {
            const active =
              item.href === "/painel" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200",
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                )}
              >
                {active ? (
                  <span className="absolute top-2 bottom-2 -left-1 hidden w-1 rounded-full bg-amber-400 lg:block" />
                ) : null}
                <span
                  className={cn(
                    "transition-transform duration-200 group-hover:scale-110",
                    active ? "text-brand-600" : "text-ink-400",
                  )}
                >
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
