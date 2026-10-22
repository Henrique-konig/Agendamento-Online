import { expect, test } from "@playwright/test";
import {
  clearMails,
  createProfessional,
  linkIn,
  signIn,
  signOut,
  waitForMail,
} from "./support/helpers";

test("recuperar a senha: link por e-mail, nova senha, senha antiga deixa de valer e o link é de uso único", async ({
  page,
  request,
}) => {
  await clearMails(request);
  const pro = await createProfessional(page, "Conta Senha");
  await signOut(page);

  await page.goto("/esqueci-senha");
  await page.fill("#email", pro.email);
  await page.click("button[type=submit]");
  const mail = await waitForMail(request, pro.email, "Redefinir sua senha");
  const link = linkIn(mail, /https?:\/\/\S+\/redefinir-senha\S*/);

  await page.goto(link);
  // confirmação diferente é recusada
  await page.fill("#password", "nova-senha-456");
  await page.fill("#confirm", "diferente-456");
  await page.click("button[type=submit]");
  await expect(page.getByText("Revise os campos destacados.")).toBeVisible();
  await page.fill("#password", "nova-senha-456");
  await page.fill("#confirm", "nova-senha-456");
  await page.click("button[type=submit]");
  await page.waitForURL(/\/entrar\?senha=alterada/);

  await signIn(page, pro.email, "senha-forte-123");
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  await signIn(page, pro.email, "nova-senha-456");
  await page.waitForURL("**/painel");

  // o mesmo link não funciona uma segunda vez
  await signOut(page);
  await page.goto(link);
  await expect(page.getByText("Este link expirou, já foi usado ou é inválido.")).toBeVisible();
  await expect(page.locator("#password")).toHaveCount(0);
});

test("pedir recuperação para e-mail inexistente responde igual (sem revelar quem tem conta)", async ({
  page,
  request,
}) => {
  await clearMails(request);
  await page.goto("/esqueci-senha");
  await page.fill("#email", "ninguem-existe@example.com");
  await page.click("button[type=submit]");
  await expect(
    page.getByText(
      "Se este e-mail estiver cadastrado, enviamos um link para escolher uma nova senha.",
    ),
  ).toBeVisible();
  const mails = await (await request.get("http://127.0.0.1:2526/mails")).json();
  expect(mails.some((m: { to: string[] }) => m.to.includes("ninguem-existe@example.com"))).toBe(
    false,
  );
});
