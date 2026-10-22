import { expect, test } from "@playwright/test";
import {
  clearMails,
  createProfessional,
  linkIn,
  signIn,
  signOut,
  waitForMail,
} from "./support/helpers";

test("profissional publica a página, cliente agenda, e-mails saem e o cancelamento libera o horário", async ({
  page,
  browser,
  request,
}) => {
  await clearMails(request);
  const pro = await createProfessional(page);

  // Página pública com dados estruturados para SEO local
  await page.goto(`/${pro.slug}`);
  await expect(page.getByRole("heading", { name: pro.name, level: 1 })).toBeVisible();
  await expect(page.getByText("R$ 45,00").first()).toBeVisible();
  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(jsonLd["@type"]).toContain("LocalBusiness");

  // Cliente escolhe um horário livre e agenda (contexto limpo = outro visitante)
  const visitor = await browser.newContext({ ...test.info().project.use });
  const client = await visitor.newPage();
  await client.goto(`/${pro.slug}/agendar`);
  const slots = client.locator("fieldset").nth(1).locator("button");
  await expect(slots.first()).toBeVisible();
  const slotsBefore = await slots.count();
  const chosen = (await slots.first().textContent())!.trim();
  await slots.first().click();
  await client.fill("#name", "Maria Souza");
  await client.fill("#phone", "(51) 98888-7777");
  await client.fill("#email", "maria@example.com");
  await client.click("button[type=submit]");
  await client.waitForURL("**/agendamento/*");
  await expect(client.getByRole("heading", { name: "Agendamento recebido!" })).toBeVisible();
  const manageUrl = client.url();

  // E-mails: confirmação ao cliente e aviso ao profissional
  const confirmation = await waitForMail(request, "maria@example.com", "Agendamento confirmado");
  expect(linkIn(confirmation, /https?:\/\/\S+\/agendamento\/[0-9a-f-]{36}/)).toContain(
    new URL(manageUrl).pathname,
  );
  await waitForMail(request, pro.email, "Novo agendamento: Maria Souza");

  // O horário some para os outros visitantes
  const other = await (await browser.newContext({ ...test.info().project.use })).newPage();
  await other.goto(`/${pro.slug}/agendar`);
  await expect(other.locator("fieldset").nth(1).locator("button").first()).toBeVisible();
  expect(await other.locator("fieldset").nth(1).locator("button").count()).toBe(slotsBefore - 1);

  // O profissional vê o agendamento na agenda
  await page.goto("/painel/agenda");
  const maria = page.getByText("Maria Souza");
  for (let i = 0; i < 8 && !(await maria.count()); i++) {
    await page.getByText("Próximo →").click();
    await page.waitForLoadState("networkidle");
  }
  await expect(maria.first()).toBeVisible();

  // Cliente cancela pelo link: o horário volta e o profissional é avisado
  await client.getByRole("button", { name: "Cancelar agendamento" }).click();
  await expect(client.getByText("Cancelado").first()).toBeVisible();
  await waitForMail(request, pro.email, "Cancelamento: Maria Souza");
  await other.reload();
  await expect(other.locator("fieldset").nth(1).locator("button").first()).toBeVisible();
  expect(await other.locator("fieldset").nth(1).locator("button").count()).toBe(slotsBefore);
  expect(chosen).toMatch(/^\d{2}:\d{2}$/);

  await signOut(page);
  await visitor.close();
});

test("conta nova só enxerga os próprios dados e o painel exige login", async ({
  page,
  context,
}) => {
  await page.goto("/painel/agenda");
  await page.waitForURL(/\/entrar\?proximo=%2Fpainel%2Fagenda/);

  const pro = await createProfessional(page, "Oficina Isolada");
  await page.goto("/painel/clientes");
  await expect(page.getByText("Ainda sem clientes")).toBeVisible();

  await signOut(page);
  await context.clearCookies();
  await signIn(page, pro.email, "senha-errada-999");
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  // o e-mail digitado é mantido após o erro
  await expect(page.locator("#email")).toHaveValue(pro.email);
});
