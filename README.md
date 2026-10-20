# Agenda Autônomo

Site com página profissional e agendamento online para autônomos — barbeiros,
nutricionistas, eletricistas e outros profissionais que hoje dependem de
WhatsApp e caderno.

## Funcionalidades

| Recurso                                                                            | Etapa        |
| ---------------------------------------------------------------------------------- | ------------ |
| Cadastro, login e painel do profissional                                           | 0 — Fundação |
| Página pública com serviços, preços, fotos e localização                           | 1            |
| Agendamento só com horários livres + formulário de orçamento                       | 2            |
| Painel de horários, bloqueios, agendamentos e clientes                             | 2            |
| Lembrete automático por e-mail/WhatsApp no dia anterior                            | 3            |
| Sincronização com Google Agenda — [`docs/GOOGLE-AGENDA.md`](docs/GOOGLE-AGENDA.md) | 4            |
| Pagamento antecipado via Pix (opcional) — [`docs/PIX.md`](docs/PIX.md)             | 5            |

O roteiro completo está em [`docs/ROADMAP.md`](docs/ROADMAP.md) e a
arquitetura em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + **TypeScript**
- **Tailwind CSS 4**
- **Neon** (Postgres serverless) com **Prisma 7**
- **Login próprio** (senha com bcrypt, sessão em cookie httpOnly guardada no banco)
- **Vercel Blob** para as fotos
- **Resend** (e-mail) e **WhatsApp Cloud API** — [`docs/LEMBRETES.md`](docs/LEMBRETES.md)
- **Zod** para validação de entrada, **Vitest** para testes

## Rodando localmente

Requisitos: Node.js 20.9+ (veja `.nvmrc`) e um Postgres (um banco gratuito no
[Neon](https://neon.tech) serve; Postgres local também).

```bash
npm install                  # também gera o cliente Prisma (postinstall)
cp .env.example .env.local   # preencha DATABASE_URL
npm run db:migrate           # aplica as migrations
npm run dev
```

As fotos usam o Vercel Blob: sem `BLOB_READ_WRITE_TOKEN` o envio de imagens
não funciona em desenvolvimento (todo o resto funciona).

### Banco de dados

O esquema está em `prisma/schema.prisma` e as migrations em
`prisma/migrations/`. Regras que o Prisma não expressa (sobreposição de
horários, validações de formato, gatilhos) ficam em SQL dentro das migrations.

```bash
npm run db:migrate    # aplica migrations pendentes (prisma migrate deploy)
npm run db:generate   # regenera o cliente depois de mudar o schema
npm run db:studio     # navegador de dados
```

Para criar uma migration nova: edite `prisma/schema.prisma` e rode
`npx prisma migrate dev --name descricao` contra um banco de desenvolvimento.

## Deploy (Vercel + Neon)

Passo a passo em [`docs/DEPLOY.md`](docs/DEPLOY.md). Em resumo: conecte o Neon
e o Blob pela aba **Storage** da Vercel (as variáveis entram sozinhas), defina
`NEXT_PUBLIC_SITE_URL` e `CRON_SECRET`, e faça o deploy — as migrations rodam
no build.

## Scripts

| Comando             | O que faz                                                    |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Servidor de desenvolvimento                                  |
| `npm run build`     | Build de produção                                            |
| `npm run lint`      | ESLint                                                       |
| `npm run typecheck` | Gera tipos de rotas e roda `tsc`                             |
| `npm test`          | Testes unitários (Vitest)                                    |
| `npm run test:db`   | Migrations + testes SQL das regras do banco (`DATABASE_URL`) |
| `npm run format`    | Prettier                                                     |

## Fluxo de trabalho

Cada etapa do MVP vive em sua própria branch — veja
[`CONTRIBUTING.md`](CONTRIBUTING.md).
