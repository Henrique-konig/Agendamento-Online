import { afterEach, describe, expect, it, vi } from "vitest";
import { queryFreeBusy, deleteEvent } from "./calendar";
import { buildAuthUrl, emailFromIdToken, hasCalendarScopes, GOOGLE_SCOPES } from "./oauth";

afterEach(() => vi.unstubAllGlobals());

describe("OAuth do Google", () => {
  it("monta URL de consentimento com acesso offline", () => {
    const url = new URL(
      buildAuthUrl({ clientId: "cid", redirectUri: "https://x.com/cb", state: "st" }),
    );
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("st");
    expect(url.searchParams.get("scope")).toContain("calendar.events");
  });

  it("extrai e-mail do id_token", () => {
    const payload = Buffer.from(JSON.stringify({ email: "ana@gmail.com" })).toString("base64url");
    expect(emailFromIdToken(`h.${payload}.s`)).toBe("ana@gmail.com");
    expect(emailFromIdToken("lixo")).toBeNull();
  });

  it("verifica escopos concedidos", () => {
    expect(hasCalendarScopes(GOOGLE_SCOPES.join(" "))).toBe(true);
    expect(hasCalendarScopes("openid email")).toBe(false);
  });
});

describe("API do Calendar", () => {
  it("converte free/busy em intervalos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            calendars: {
              primary: { busy: [{ start: "2026-11-02T12:00:00Z", end: "2026-11-02T13:00:00Z" }] },
            },
          }),
        ),
      ),
    );
    const busy = await queryFreeBusy("tok", "primary", new Date(), new Date());
    expect(busy).toEqual([
      { start: new Date("2026-11-02T12:00:00Z"), end: new Date("2026-11-02T13:00:00Z") },
    ]);
  });

  it("ignora evento já removido no Google", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 410 })));
    await expect(deleteEvent("tok", "primary", "ev1")).resolves.toBeUndefined();
  });
});
