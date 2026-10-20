# Agenda Autônomo

Site com página profissional e agendamento online para autônomos — barbeiros,
nutricionistas, eletricistas e outros profissionais que hoje dependem de
WhatsApp e caderno.

## Funcionalidades

| Recurso                                                      | Etapa        |
| ------------------------------------------------------------ | ------------ |
| Cadastro, login e painel do profissional                     | 0 — Fundação |
| Página pública com serviços, preços, fotos e localização     | 1            |
| Agendamento só com horários livres + formulário de orçamento | 2            |
| Painel de horários, bloqueios, agendamentos e clientes       | 2            |
| Lembrete automático por e-mail/WhatsApp no dia anterior      | 3            |
| Sincronização com Google Agenda                              | 4            |
| Pagamento antecipado via Pix (opcional)                      | 5            |

O roteiro completo está em [`docs/ROADMAP.md`](docs/ROADMAP.md) e a
arquitetura em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** — Postgres, autenticação, Storage e Row Level Security
- **Resend** (e-mail) e **WhatsApp Cloud API** para notificações — veja
  [`docs/LEMBRETES.md`](docs/LEMBRETES.md)
- **Zod** para validação de entrada
- **Vitest** para testes unitários

## Rodando localmente

Requisitos: Node.js 20.9+ (veja `.nvmrc`) e um projeto Supabase.

```bash
npm install
cp .env.example .env.local   # preencha as chaves do Supabase
npm run dev
```

### Banco de dados

As migrations ficam em `supabase/migrations/`, em ordem. Com o
[Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <seu-projeto>
supabase db push        # aplica as migrations
npm run db:types        # regenera src/types/database.ts
```

Sem o CLI, execute os arquivos `.sql` em ordem no SQL Editor do Supabase.

Em **Authentication → URL Configuration**, adicione
`<NEXT_PUBLIC_SITE_URL>/auth/confirmar` às Redirect URLs.

## Scripts

| Comando             | O que faz                        |
| ------------------- | -------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento      |
| `npm run build`     | Build de produção                |
| `npm run lint`      | ESLint                           |
| `npm run typecheck` | Gera tipos de rotas e roda `tsc` |
| `npm test`          | Testes unitários (Vitest)        |
| `npm run format`    | Prettier                         |

## Fluxo de trabalho

Cada etapa do MVP vive em sua própria branch — veja
[`CONTRIBUTING.md`](CONTRIBUTING.md).
