import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sendNotification = vi.fn();
vi.mock("web-push", () => ({ default: { sendNotification } }));

const findMany = vi.fn();
const deleteMany = vi.fn();
vi.mock("@/lib/db", () => ({ db: { pushSubscription: { findMany, deleteMany } } }));

const payload = { title: "t", body: "b", url: "/painel" };
const subs = [
  { id: "1", endpoint: "https://fcm.googleapis.com/fcm/send/1", p256dh: "p1", auth: "a1" },
  {
    id: "2",
    endpoint: "https://updates.push.services.mozilla.com/wpush/2",
    p256dh: "p2",
    auth: "a2",
  },
  { id: "3", endpoint: "https://web.push.apple.com/3", p256dh: "p3", auth: "a3" },
];

beforeEach(() => {
  vi.resetModules();
  sendNotification.mockReset();
  findMany.mockReset();
  deleteMany.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.VAPID_PUBLIC_KEY = "B".repeat(87);
  process.env.VAPID_PRIVATE_KEY = "k".repeat(43);
  process.env.VAPID_SUBJECT = "mailto:eu@example.com";
});

async function load() {
  return (await import("./send")).sendPushToProfessional;
}

describe("sendPushToProfessional", () => {
  it("sem chaves VAPID não consulta nem envia nada", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    const send = await load();
    expect(await send("p1", payload)).toEqual({ sent: 0, removed: 0, failed: 0 });
    expect(findMany).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("sem aparelhos ativos não envia", async () => {
    findMany.mockResolvedValue([]);
    const send = await load();
    expect(await send("p1", payload)).toEqual({ sent: 0, removed: 0, failed: 0 });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("envia o payload em JSON para todos os aparelhos do profissional", async () => {
    findMany.mockResolvedValue(subs);
    sendNotification.mockResolvedValue({});
    const send = await load();
    expect(await send("p1", payload)).toEqual({ sent: 3, removed: 0, failed: 0 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { professional_id: "p1" } }),
    );
    const [target, body] = sendNotification.mock.calls[0];
    expect(target).toEqual({ endpoint: subs[0].endpoint, keys: { p256dh: "p1", auth: "a1" } });
    expect(JSON.parse(body)).toEqual(payload);
  });

  it("ignora endpoints fora dos serviços de push (SSRF), mesmo já gravados", async () => {
    findMany.mockResolvedValue([
      { id: "x", endpoint: "https://169.254.169.254/latest", p256dh: "p", auth: "a" },
      subs[0],
    ]);
    sendNotification.mockResolvedValue({});
    const send = await load();
    expect(await send("p1", payload)).toEqual({ sent: 1, removed: 0, failed: 0 });
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(sendNotification.mock.calls[0][0].endpoint).toBe(subs[0].endpoint);
  });

  it("404/410 removem a inscrição; outros erros só contam como falha", async () => {
    findMany.mockResolvedValue(subs);
    sendNotification
      .mockRejectedValueOnce(Object.assign(new Error("gone"), { statusCode: 410 }))
      .mockRejectedValueOnce(Object.assign(new Error("boom"), { statusCode: 500 }))
      .mockResolvedValueOnce({});
    deleteMany.mockResolvedValue({ count: 1 });
    const send = await load();
    expect(await send("p1", payload)).toEqual({ sent: 1, removed: 1, failed: 1 });
    expect(deleteMany).toHaveBeenCalledTimes(1);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "1" } });
  });
});
