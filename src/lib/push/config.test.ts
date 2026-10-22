import { describe, expect, it } from "vitest";
import { isAllowedPushEndpoint, pushConfig } from "./config";

const valid = {
  VAPID_PUBLIC_KEY: "B".repeat(87),
  VAPID_PRIVATE_KEY: "k".repeat(43),
  VAPID_SUBJECT: "mailto:eu@example.com",
};

describe("pushConfig", () => {
  it("com as três variáveis, devolve a configuração", () => {
    expect(pushConfig(valid)).toEqual({
      publicKey: valid.VAPID_PUBLIC_KEY,
      privateKey: valid.VAPID_PRIVATE_KEY,
      subject: valid.VAPID_SUBJECT,
    });
  });

  it("aceita https como contato", () => {
    expect(pushConfig({ ...valid, VAPID_SUBJECT: "https://agenda.example.com" })).not.toBeNull();
  });

  it("falta qualquer uma, vazia ou inválida: push desligado, sem erro", () => {
    expect(pushConfig({})).toBeNull();
    expect(pushConfig({ ...valid, VAPID_PRIVATE_KEY: "" })).toBeNull();
    expect(pushConfig({ ...valid, VAPID_PUBLIC_KEY: "curta" })).toBeNull();
    expect(pushConfig({ ...valid, VAPID_SUBJECT: "eu@example.com" })).toBeNull();
  });
});

describe("isAllowedPushEndpoint", () => {
  const allowed = [
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://web.push.apple.com/abc",
    "https://wns2-par02p.notify.windows.com/w/?token=abc",
  ];
  const blocked = [
    "http://fcm.googleapis.com/fcm/send/abc", // sem TLS
    "https://localhost/hook",
    "https://127.0.0.1:8080/x",
    "https://169.254.169.254/latest/meta-data",
    "https://intranet.empresa.local/api",
    "https://fcm.googleapis.com.evil.com/x", // sufixo enganoso
    "https://evilfcm.googleapis.com.attacker.io/x",
    "https://user:pass@fcm.googleapis.com/x",
    "https://notify.windows.com.evil.com/x",
    "javascript:alert(1)",
    "não é url",
  ];

  it.each(allowed)("aceita %s", (url) => expect(isAllowedPushEndpoint(url, {})).toBe(true));
  it.each(blocked)("recusa %s", (url) => expect(isAllowedPushEndpoint(url, {})).toBe(false));

  it("PUSH_EXTRA_HOSTS libera hosts extras (testes) sem afrouxar o resto", () => {
    const env = { PUSH_EXTRA_HOSTS: "127.0.0.1, push.teste" };
    expect(isAllowedPushEndpoint("https://127.0.0.1:9443/x", env)).toBe(true);
    expect(isAllowedPushEndpoint("https://169.254.169.254/x", env)).toBe(false);
  });
});
