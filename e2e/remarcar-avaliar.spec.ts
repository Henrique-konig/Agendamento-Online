import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { query } from "./support/db";
import { settle } from "./support/helpers";
import {
  clearMails,
  createProfessional,
  linkIn,
  signOut,
  waitForMail,
  type Professional,
} from "./support/helpers";

const CRON = { authorization: "Bearer cron-secreto-de-teste-1234567890" };

async function book(page: Page, pro: Professional, nth = 0, email = "maria@example.com") {
  await page.goto(`/${pro.slug}/agendar`);
  const slots = page.locator("fieldset").nth(1).locator("button");
  await expect(slots.first()).toBeVisible();
  const label = (await slots.nth(nth).textContent())!.trim();
  await slots.nth(nth).click();
  await page.fill("#name", "Maria Souza");
  await page.fill("#phone", "(51) 98888-7777");
  await page.fill("#email", email);
  await page.click("button[type=submit]");
  await page.waitForURL("**/agendamento/*");
  return { label, url: page.url().split("?")[0] };
}

async function seriousViolations(page: Page) {
  await settle(page);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.help} — ${v.nodes[0]?.target.join(" ")}`);
}

test("cliente remarca pelo link: horário antigo volta a ficar livre e os dois são avisados", async ({
  page,
  browser,
  request,
}) => {
  await clearMails(request);
  const pro = await createProfessional(page, "Studio Remarca");

  const visitor = await (await browser.newContext({ ...test.info().project.use })).newPage();
  const booking = await book(visitor, pro);

  await visitor.getByRole("link", { name: "Remarcar horário" }).click();
  await visitor.waitForURL("**/remarcar");
  const slots = visitor.locator("fieldset").nth(1).locator("button");
  await expect(slots.first()).toBeVisible();
  const options = (await slots.allTextContents()).map((t) => t.trim());
  // o horário atual do próprio agendamento aparece livre
  expect(options).toContain(booking.label);
  const target = options.find((o) => o !== booking.label)!;

  expect(await seriousViolations(visitor)).toEqual([]);

  await slots.filter({ hasText: target }).first().click();
  await visitor.getByRole("button", { name: new RegExp(`Remarcar para ${target}`) }).click();
  await visitor.waitForURL(/remarcado=1/);
  await expect(visitor.getByRole("heading", { name: "Horário alterado!" })).toBeVisible();
  await expect(visitor.getByText(`${target} às`)).toBeVisible();

  await waitForMail(request, "maria@example.com", "Horário alterado");
  await waitForMail(request, pro.email, "Remarcado: Maria Souza");

  // para outros visitantes o horário antigo voltou e o novo está ocupado
  const other = await (await browser.newContext({ ...test.info().project.use })).newPage();
  await other.goto(`/${pro.slug}/agendar`);
  const otherSlots = (
    await other.locator("fieldset").nth(1).locator("button").allTextContents()
  ).map((t) => t.trim());
  expect(otherSlots).toContain(booking.label);
  expect(otherSlots).not.toContain(target);

  // remarcar para o mesmo horário não é aceito
  await visitor.goto(`${booking.url}/remarcar`);
  await visitor.locator("fieldset").nth(1).locator("button", { hasText: target }).first().click();
  await visitor.getByRole("button", { name: /Remarcar para/ }).click();
  await expect(visitor.getByText("Escolha um horário diferente do atual.")).toBeVisible();
});

test("avaliação: pedido por e-mail, estrelas, página pública, moderação e relatórios", async ({
  page,
  browser,
  request,
}) => {
  await clearMails(request);
  const pro = await createProfessional(page, "Studio Avalia");

  const visitor = await (await browser.newContext({ ...test.info().project.use })).newPage();
  const booking = await book(visitor, pro);

  // enquanto o atendimento não aconteceu, não há como avaliar
  await expect(visitor.getByRole("link", { name: "Avaliar atendimento" })).toHaveCount(0);
  await visitor.goto(`${booking.url}/avaliar`);
  expect(visitor.url()).not.toContain("/avaliar");

  // o atendimento "acontece" (6 h atrás) e o cron diário pede a avaliação
  await query(
    `update appointments set starts_at = now() - interval '6 hours',
       ends_at = now() - interval '330 minutes', status = 'completed'
     where cancel_token = $1`,
    [booking.url.split("/").pop()],
  );
  const cron = await request.get("/api/cron/lembretes", { headers: CRON });
  expect((await cron.json()).reviews.sent).toBeGreaterThanOrEqual(1);
  const mail = await waitForMail(request, "maria@example.com", "Como foi seu atendimento");
  const link = linkIn(mail, /https?:\/\/\S+\/agendamento\/[0-9a-f-]{36}\/avaliar/);

  // rodar o cron de novo não duplica o pedido
  await request.get("/api/cron/lembretes", { headers: CRON });
  const mails = (await (await request.get("http://127.0.0.1:2526/mails")).json()) as {
    to: string[];
    subject: string;
  }[];
  expect(
    mails.filter((m) => m.to.includes("maria@example.com") && m.subject.includes("Como foi")),
  ).toHaveLength(1);

  await visitor.goto(new URL(link).pathname);
  const send = visitor.getByRole("button", { name: /Escolha uma nota/ });
  await expect(send).toBeDisabled();
  expect(await seriousViolations(visitor)).toEqual([]);
  await visitor.getByRole("button", { name: /^4 estrelas/ }).click();
  await visitor.fill("#comment", "Atendimento ótimo e pontual! <b>x</b>");
  await visitor.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(visitor.getByText("Obrigado pela sua avaliação (4 de 5)")).toBeVisible();

  // avaliar de novo redireciona
  await visitor.goto(new URL(link).pathname);
  expect(visitor.url()).not.toContain("/avaliar");

  // página pública: média, nome abreviado e comentário escapado
  await visitor.goto(`/${pro.slug}`);
  const section = visitor.locator("#avaliacoes");
  await expect(section).toContainText("4,0");
  await expect(section).toContainText("1 avaliação");
  await expect(section).toContainText("Maria S.");
  await expect(section).toContainText("<b>x</b>");
  expect(await seriousViolations(visitor)).toEqual([]);

  // painel: moderar e ver nos relatórios
  await page.goto("/painel/avaliacoes");
  await expect(page.getByText("Atendimento ótimo e pontual!")).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
  await page.getByRole("button", { name: "Ocultar da página" }).click();
  await expect(page.getByText("Oculta para o público")).toBeVisible();
  await visitor.reload();
  await expect(visitor.locator("#avaliacoes")).toHaveCount(0);

  await page.goto("/painel/relatorios");
  await expect(page.getByRole("heading", { name: "Relatórios", level: 1 })).toBeVisible();
  await expect(page.getByText("Receita estimada")).toBeVisible();
  await expect(page.getByText("R$ 45,00").first()).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
  for (const periodo of ["30 dias", "90 dias", "12 meses"]) {
    await expect(page.getByRole("link", { name: periodo })).toBeVisible();
  }

  await signOut(page);
});

test("notificações: cartão de avisos no celular e preferências acessíveis", async ({ page }) => {
  await createProfessional(page, "Studio Push");
  await page.goto("/painel/notificacoes");
  // sem chaves VAPID no ambiente de teste, o cartão informa que está indisponível
  await expect(page.getByText("Avisos no celular")).toBeVisible();
  await expect(page.getByText(/chaves de avisos \(VAPID\)/)).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});
