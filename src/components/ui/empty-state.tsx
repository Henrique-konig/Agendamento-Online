import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

/** Estado vazio: diz o que falta e convida à próxima ação. */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
        <Icon name={icon} size={22} />
      </span>
      <p className="font-display text-lg font-semibold text-ink-900">{title}</p>
      {text ? <p className="mt-1 max-w-sm text-sm text-ink-500">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
