import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations usam a conexão direta (sem pooler): DIRECT_URL, ou DATABASE_URL_UNPOOLED
// (nome criado pela integração Vercel + Neon). Em desenvolvimento local basta DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url:
      process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "",
  },
});
