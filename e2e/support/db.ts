import { Client } from "pg";

/** Consulta direta ao banco de testes (para preparar estados que a interface não cria, como "atendimento já passou"). */
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    await client.end();
  }
}
