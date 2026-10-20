"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./button";

type Props = ComponentProps<typeof Button> & { pendingText?: string };

export function SubmitButton({ children, pendingText = "Salvando…", disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
