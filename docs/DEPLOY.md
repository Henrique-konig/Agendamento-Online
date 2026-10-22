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

### Avisos no celular (push)

Para o profissional receber notificações de novos agendamentos no aparelho:

1. Gere as chaves: `npx web-push generate-vapid-keys`.
2. Na Vercel, crie `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (sensível) e
   `VAPID_SUBJECT` (`mailto:seu@email.com`) e faça um novo deploy.
3. No painel, em **Notificações → Avisos no celular**, toque em **Ativar avisos
   neste aparelho**. No iPhone o app precisa estar instalado na tela inicial.

Sem as três variáveis o cartão aparece como indisponível e nada mais muda.

## 4. Deploy

O script `vercel-build` (`scripts/vercel-build.mjs`) roda `prisma migrate deploy`
**somente em produção**, antes do `next build`. Se a produção não tiver banco
configurado, o build falha com uma mensagem clara. Previews apenas buildam: uma
branch com migration nova nunca altera o banco de produção. Para previews com
banco próprio, use branches do Neon (a integração oferece isso).

## 5. Primeiro acesso

Abra `/cadastro`, crie a conta e configure a página. Não há confirmação por
e-mail: a conta entra direto.

## Segurança — o que mudou ao sair do Supabase

Sem Row Level Security, **toda consulta de dados do painel filtra por
`professional_id`** do usuário logado (veja `src/lib/auth.ts`). Ao criar uma
consulta nova, siga o mesmo padrão e nunca receba o id do profissional do
navegador. Sessões ficam na tabela `sessions` (só o hash do token); login
limita 5 falhas por e-mail e 30 por IP a cada 15 minutos.
