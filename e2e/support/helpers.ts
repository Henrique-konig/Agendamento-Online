import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const PASSWORD = "senha-forte-123";

export type Professional = { name: string; slug: string; email: string };

/** Nome único por execução: o banco dos testes é compartilhado e nunca é limpo. */
export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Cria a conta, passa pelo onboarding, publica a página e cadastra um serviço de 30 min. */
export async function createProfessional(
  page: Page,
  prefix = "Studio Teste",
): Promise<Professional> {
  const name = uniqueName(prefix);
  const email = `${slugify(name)}@example.com`;

  await page.goto("/cadastro");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL("**/painel/boas-vindas");

  await page.fill("#display_name", name);
  await page.fill("#profession", "Barbeiro");
  const slug = await page.inputValue("#slug");
  await page.click("button[type=submit]");
  await page.waitForURL("**/painel");

  await page.goto("/painel/perfil");
  await page.fill("#bio", "Cortes clássicos e modernos há 10 anos no Centro.");
  await page.fill("#whatsapp", "(51) 99999-8888");
  await page.fill("#address_line", "Rua dos Andradas, 1000");
  await page.fill("#neighborhood", "Centro Histórico");
  await page.fill("#city", "Porto Alegre");
  await page.selectOption("#state", "RS");
  await page.fill("#postal_code", "90020-000");
  await page.check("input[name=published]");
  await page.click("text=Salvar alterações");
  await expect(page.getByText("Perfil atualizado.")).toBeVisible();

  await page.goto("/painel/servicos/novo");
  await page.fill("#name", "Corte masculino");
  await page.fill("#duration_minutes", "30");
  await page.fill("#price", "45,00");
  await page.click("text=Criar serviço");
  await page.waitForURL("**/painel/servicos");

  return { name, slug, email };
}

export type Mail = { to: string[]; from: string; subject: string; body: string };

export async function clearMails(request: APIRequestContext) {
  await request.delete("http://127.0.0.1:2526/mails");
}

/** Espera chegar um e-mail para o destinatário com o assunto (trecho) informado. */
export async function waitForMail(
  request: APIRequestContext,
  to: string,
  subjectPart: string,
): Promise<Mail> {
  let found: Mail | undefined;
  await expect
    .poll(
      async () => {
        const all = (await (await request.get("http://127.0.0.1:2526/mails")).json()) as Mail[];
        found = all.find((m) => m.to.includes(to) && m.subject.includes(subjectPart));
        return Boolean(found);
      },
      { message: `e-mail "${subjectPart}" para ${to}`, timeout: 15_000 },
    )
    .toBe(true);
  return found!;
}

export function linkIn(mail: Mail, pattern: RegExp) {
  const match = mail.body.match(pattern);
  if (!match) throw new Error(`link ${pattern} não encontrado no e-mail "${mail.subject}"`);
  return match[0];
}

export async function signOutIfNeeded(page: Page) {
  await page.context().clearCookies();
}

/** Sair do painel: no celular o botão fica na folha "Mais"; no desktop, na barra lateral. */
export async function signOut(page: Page) {
  const more = page.getByRole("button", { name: "Mais" });
  if (await more.isVisible()) await more.click();
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL("**/entrar");
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/entrar");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
}

/**
 * Espera as animações de entrada acabarem: o axe mede o contraste com a opacidade do momento.
 * Animações infinitas (ex.: o ponto pulsante da página inicial) são ignoradas, senão nunca terminam.
 */
export async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => null)),
    ),
  );
}
