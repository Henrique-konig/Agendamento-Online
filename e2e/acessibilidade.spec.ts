import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createProfessional } from "./support/helpers";

async function audit(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const report = serious.map(
    (v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length}× ${v.nodes[0]?.target.join(" ")}`,
  );
  expect(report, `${label}\n${report.join("\n")}`).toEqual([]);
}

test("páginas públicas sem violações sérias de acessibilidade", async ({ page }) => {
  const pro = await createProfessional(page, "Acesso Publico");
  await page.context().clearCookies();
  for (const [label, path] of [
    ["início", "/"],
    ["entrar", "/entrar"],
    ["cadastro", "/cadastro"],
    ["esqueci a senha", "/esqueci-senha"],
    ["página do profissional", `/${pro.slug}`],
    ["agendar", `/${pro.slug}/agendar`],
  ] as const) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await audit(page, label);
  }
});

test("painel sem violações sérias de acessibilidade", async ({ page }) => {
  await createProfessional(page, "Acesso Painel");
  for (const [label, path] of [
    ["início", "/painel"],
    ["agenda", "/painel/agenda"],
    ["serviços", "/painel/servicos"],
    ["perfil", "/painel/perfil"],
    ["horários", "/painel/horarios"],
    ["notificações", "/painel/notificacoes"],
  ] as const) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await audit(page, `painel: ${label}`);
  }
});
