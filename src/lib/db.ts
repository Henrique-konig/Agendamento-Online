import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente Prisma único por processo, criado no primeiro uso (o build não exige
 * DATABASE_URL). Em desenvolvimento, fica em `globalThis` para sobreviver ao
 * hot reload sem abrir conexões novas.
 *
 * DATABASE_URL deve apontar para a conexão com pooler do Neon (host `-pooler`).
 */
const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

function getClient() {
  if (globalForDb.prisma) return globalForDb.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não definida");

  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  globalForDb.prisma = client;
  return client;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export type Db = PrismaClient;
