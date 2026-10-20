# Deploy: Vercel + Neon

## 1. Banco de dados (Neon)

Pela Vercel (mais simples): projeto → **Storage → Create Database → Neon**.
A integração cria as variáveis `DATABASE_URL` (com pooler) e
`DATABASE_URL_UNPOOLED` (direta) no projeto.

Ou direto no [neon.tech](https://neon.tech): crie um projeto na região mais
próxima (ex.: São Paulo), copie as duas strings de **Connect** e crie na Vercel:

| Variável       | Valor                                              |
| -------------- | -------------------------------------------------- |
| `DATABASE_URL` | string **com** `-pooler` no host                   |
| `DIRECT_URL`   | string **sem** `-pooler` (usada só nas migrations) |

## 2. Fotos (Vercel Blob)

**Storage → Create → Blob**. A variável `BLOB_READ_WRITE_TOKEN` é criada sozinha.

## 3. Variáveis do app

| Variável               | Valor                                                 |
| ---------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | URL final, sem barra no final                         |
| `CRON_SECRET`          | senha aleatória, 16+ caracteres (protege o agendador) |

Integrações opcionais (Resend, Google, Pix) estão no `.env.example`.

## 4. Deploy

O script `vercel-build` roda `prisma migrate deploy` antes do `next build`:
cada deploy aplica as migrations pendentes no banco do ambiente. Para deploys
de preview, use branches do Neon (a integração oferece isso) em vez de apontar
previews para o banco de produção.

## 5. Primeiro acesso

Abra `/cadastro`, crie a conta e configure a página. Não há confirmação por
e-mail: a conta entra direto.

## Segurança — o que mudou ao sair do Supabase

Sem Row Level Security, **toda consulta de dados do painel filtra por
`professional_id`** do usuário logado (veja `src/lib/auth.ts`). Ao criar uma
consulta nova, siga o mesmo padrão e nunca receba o id do profissional do
navegador. Sessões ficam na tabela `sessions` (só o hash do token); login
limita 5 falhas por e-mail e 30 por IP a cada 15 minutos.
