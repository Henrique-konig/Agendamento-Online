import { expect, test } from "@playwright/test";
import { createProfessional } from "./support/helpers";

test("manifest, ícones e service worker do app instalável", async ({ request, page }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/painel");
  expect(manifest.theme_color).toBe("#0f6a6e");

  const purposes = manifest.icons.map(
    (i: { sizes: string; purpose: string }) => `${i.sizes}:${i.purpose}`,
  );
  for (const expected of ["192x192:any", "512x512:any", "192x192:maskable", "512x512:maskable"]) {
    expect(purposes).toContain(expected);
  }
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  }

  const sw = await request.get("/sw.js");
  expect(sw.headers()["content-type"]).toContain("javascript");
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  expect((await request.get("/offline.html")).status()).toBe(200);

  await page.goto("/entrar");
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('link[rel="icon"]').first()).toBeAttached();
});

test("painel: barra de baixo no celular, menu lateral no desktop", async ({ page }, testInfo) => {
  await createProfessional(page, "Layout Painel");
  await page.goto("/painel");
  const bottom = page.getByRole("navigation", { name: "Painel" });
  if (testInfo.project.name === "celular") {
    await expect(page.getByRole("button", { name: "Mais" })).toBeVisible();
    await page.getByRole("button", { name: "Mais" }).click();
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mais" })).toBeHidden();
  }
  await expect(bottom.first()).toBeVisible();
});

test("nenhuma página principal passa da largura em telas de 320px", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "celular", "só faz sentido no celular");
  await page.setViewportSize({ width: 320, height: 640 });
  const pro = await createProfessional(page, "Largura Minima");
  const paths = [
    "/",
    "/entrar",
    "/cadastro",
    `/${pro.slug}`,
    `/${pro.slug}/agendar`,
    "/painel",
    "/painel/agenda",
    "/painel/horarios",
    "/painel/servicos",
    "/painel/notificacoes",
  ];
  for (const path of paths) {
    await page.goto(path);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, `${path} estoura a largura (${width}px)`).toBeLessThanOrEqual(320);
  }
});
