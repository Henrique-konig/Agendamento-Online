import type { z } from "zod";

/** Estado padrão retornado por Server Actions usadas com useActionState. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Valores a manter nos campos: o React limpa o formulário ao fim de cada ação. */
  values?: Record<string, string>;
};

export const initialActionState: ActionState = {};

export function fromZodError(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, message: "Revise os campos destacados.", fieldErrors };
}
