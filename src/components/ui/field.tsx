import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const control =
  "block w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-ink-900 shadow-xs ring-1 ring-inset ring-ink-200 transition-shadow placeholder:text-ink-400 hover:ring-ink-300 focus:ring-2 focus:ring-inset focus:ring-brand-600 disabled:bg-ink-50 aria-invalid:ring-red-500";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-10", className)} {...props} />;
}

type FieldProps = {
  label: string;
  name: string;
  hint?: ReactNode;
  errors?: string[];
  children: ReactNode;
  className?: string;
};

/** Agrupa label, controle, dica e mensagens de erro com ids acessíveis. */
export function Field({ label, name, hint, errors, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      {children}
      {hint && !errors?.length ? <p className="text-xs text-ink-500">{hint}</p> : null}
      {errors?.length ? (
        <p id={`${name}-error`} className="text-xs text-red-600">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
