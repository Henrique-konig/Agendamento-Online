# Contribuindo

## Branches

O MVP é entregue em etapas, cada uma em uma branch própria. As branches são
**empilhadas**: cada etapa parte da anterior, então podem ser revisadas e
integradas em ordem.

| Branch                           | Conteúdo                                                      | Parte de |
| -------------------------------- | ------------------------------------------------------------- | -------- |
| `feature/etapa-0-fundacao`       | Next.js, banco, autenticação, painel base, CI                 | `main`   |
| `feature/etapa-1-pagina-publica` | Perfil, serviços, fotos, localização, SEO local               | etapa 0  |
| `feature/etapa-2-agendamento`    | Disponibilidade, bloqueios, agendamento, orçamentos, clientes | etapa 1  |
| `feature/etapa-3-lembretes`      | E-mail (Resend), WhatsApp, cron do dia anterior               | etapa 2  |
| `feature/etapa-4-google-agenda`  | OAuth, free/busy e criação de eventos                         | etapa 3  |
| `feature/etapa-5-pix`            | Sinal via Pix (copia e cola e Mercado Pago)                   | etapa 4  |

Ordem de merge recomendada: etapa 0 → 1 → 2 → 3 → 4 → 5 em `main`, cada uma
por Pull Request. Correções em uma etapa já integrada entram por
`fix/<descricao>` a partir de `main`.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `db:` (migrations).

## Antes de abrir um PR

```bash
npm run lint && npm run typecheck && npm run format:check && npm test && npm run build
```

O mesmo conjunto roda no GitHub Actions (`.github/workflows/ci.yml`), junto
com os testes de banco:

```bash
# Aplica as migrations em um Postgres vazio e roda prisma/tests/*.sql
DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db
```

## Banco de dados

- O esquema vive em `prisma/schema.prisma`. Toda mudança gera uma migration nova
  (`npx prisma migrate dev --name descricao`). Nunca edite uma migration já integrada.
- Regras que o Prisma não expressa (exclusão de sobreposição, CHECKs, gatilhos)
  entram como SQL na própria migration, com teste em `prisma/tests/`.
- **Não existe RLS.** Toda consulta de dados do painel precisa filtrar por
  `professional_id` do usuário logado (`requireProfessional()`), e nenhum id de
  profissional vem do navegador.

## Organização do código

```
src/
  app/          rotas (páginas, layouts, route handlers)
  components/   componentes de UI genéricos
  features/     módulos de domínio (actions, schemas, componentes)
  lib/          infraestrutura: db, auth, env, utilitários puros
  generated/    cliente Prisma (gerado, fora do Git)
  types/        tipos de linha reexportados do Prisma
prisma/
  schema.prisma esquema do banco
  migrations/   SQL versionado
  tests/        testes SQL das regras do banco
```

Regras: lógica de negócio pura e testável em `lib/` ou `features/*/` (sem
React); Server Actions validam a entrada com Zod e verificam o dono do dado.
