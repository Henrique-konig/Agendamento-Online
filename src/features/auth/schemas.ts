import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const signUpSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "Link inválido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não são iguais.",
  });

/** Evita open redirect: aceita apenas caminhos internos. */
export function safeNextPath(value: unknown, fallback = "/painel") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}
