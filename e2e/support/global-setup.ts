import { Client } from "pg";

/**
 * Zera os contadores de tentativas de login/recuperação antes da suíte. Todos os testes
 * vêm do mesmo IP local; sem isto, rodar a suíte várias vezes seguidas bate no limite
 * de segurança do app (que continua valendo durante os testes).
 */
export default async function globalSetup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Defina DATABASE_URL para os testes de ponta a ponta.");
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("delete from login_attempts");
  } finally {
    await client.end();
  }
}
