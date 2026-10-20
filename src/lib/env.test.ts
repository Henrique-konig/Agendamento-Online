import { afterEach, describe, expect, it, vi } from "vitest";
import { publicEnv, serverEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

function stub(values: Record<string, string>) {
  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
  ]) {
    vi.stubEnv(key, values[key] ?? "");
  }
}

describe("variáveis do Supabase", () => {
  it("aceita os nomes clássicos", () => {
    stub({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    });
    expect(publicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon");
    expect(serverEnv().SUPABASE_SERVICE_ROLE_KEY).toBe("service");
  });

  it("prefere as chaves novas da integração Vercel + Supabase", () => {
    stub({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_new",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-service",
      SUPABASE_SECRET_KEY: "sb_secret_new",
    });
    expect(publicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("sb_publishable_new");
    expect(serverEnv().SUPABASE_SERVICE_ROLE_KEY).toBe("sb_secret_new");
  });

  it("falha quando a chave não existe", () => {
    stub({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" });
    expect(() => publicEnv()).toThrow(/inválidas/);
  });
});
