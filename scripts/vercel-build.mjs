// Build da Vercel: aplica as migrations do Prisma só em PRODUÇÃO e depois builda.
//
// Previews não migram: um preview de branch com migration nova alteraria o banco
// de produção. (Para previews com banco próprio, use branches do Neon.)
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const isProduction = process.env.VERCEL_ENV === "production";
const hasDatabase = Boolean(
  process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
);

if (isProduction) {
  if (!hasDatabase) {
    console.error(
      "✖ Produção sem banco: defina DATABASE_URL (Vercel > Storage > Neon) antes do deploy.",
    );
    process.exit(1);
  }
  console.log("→ Produção: aplicando migrations (prisma migrate deploy)");
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.log(`→ ${process.env.VERCEL_ENV ?? "local"}: migrations não são aplicadas`);
}

run("npx", ["next", "build"]);
