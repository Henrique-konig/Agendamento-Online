# Contribuindo

## Branches

O MVP é entregue em etapas, cada uma em uma branch própria. As branches são
**empilhadas**: cada etapa parte da anterior, então podem ser revisadas e
integradas em ordem.

| Branch                           | Conteúdo                                                      | Parte de |
| -------------------------------- | ------------------------------------------------------------- | -------- |
| `feature/etapa-0-fundacao`       | Next.js, Supabase, autenticação, painel base, CI              | `main`   |
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
# Aplica todas as migrations em um Postgres vazio e roda supabase/tests/*.sql
DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db
```

## Banco de dados

- Toda mudança de schema é uma nova migration em `supabase/migrations/`,
  nomeada `AAAAMMDDHHMMSS_descricao.sql`. Nunca edite uma migration já integrada.
- Toda tabela nova precisa de RLS habilitado e políticas explícitas, com teste
  em `supabase/tests/` provando o isolamento entre profissionais.
- Atualize `src/types/database.ts` (`npm run db:types`).

## Organização do código

```
src/
  app/          rotas (páginas, layouts, route handlers)
  components/   componentes de UI genéricos
  features/     módulos de domínio (actions, schemas, componentes)
  lib/          infraestrutura: env, supabase, utilitários puros
  types/        tipos do banco
supabase/
  migrations/   SQL versionado
```

Regras: lógica de negócio pura e testável em `lib/` ou `features/*/` (sem
React); Server Actions validam a entrada com Zod e verificam o dono do dado;
o cliente `admin` (service role) só é usado depois da validação.
