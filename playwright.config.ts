import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Testes de ponta a ponta contra o build de produção (`npm run build` antes).
 * Precisam de um Postgres em DATABASE_URL com as migrations aplicadas
 * (`npm run db:migrate`). O e-mail vai para um servidor SMTP de teste local.
 */
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/support/global-setup.ts",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1, // os testes compartilham um único banco e a caixa de e-mails de teste
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: BASE_URL, locale: "pt-BR", trace: "retain-on-failure" },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 860 } },
    },
  ],
  webServer: [
    {
      command: "node e2e/support/smtp-sink.mjs",
      url: "http://127.0.0.1:2526/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `${BASE_URL}/entrar`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SITE_URL: BASE_URL,
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "2525",
        SMTP_USER: "teste",
        SMTP_PASSWORD: "teste",
        EMAIL_FROM: "Agenda <agenda@example.com>",
        CRON_SECRET: "cron-secreto-de-teste-1234567890",
      },
    },
  ],
});
