# Arquitetura

## Visão geral

```
Visitante ──► /[slug]            (página pública, Server Components)
          ──► /[slug]/agendar    (horários livres + Server Action de reserva)
Profissional ──► /painel/*       (protegido pelo proxy + RLS)
Agendador (cron) ──► /api/cron/* (lembretes, protegido por segredo)
```

- **Multi-tenant por slug**: cada profissional é uma linha em
  `professionals` (mesmo `id` de `auth.users`) e tem uma URL pública
  `/<slug>`.
- **Segurança em camadas**: o `proxy.ts` redireciona visitantes sem sessão
  para fora do painel; as Server Actions conferem o usuário; e o banco aplica
  **RLS** — um profissional só enxerga e altera os próprios dados.
- **Visitantes não têm acesso direto a dados privados**. Ações públicas
  (reservar, pedir orçamento) passam por Server Actions que validam a entrada
  com Zod e usam o cliente `admin` no servidor.

## Clientes Supabase

| Arquivo                  | Uso                                                     |
| ------------------------ | ------------------------------------------------------- |
| `lib/supabase/server.ts` | Server Components/Actions com a sessão do usuário (RLS) |
| `lib/supabase/client.ts` | Client Components (ex.: upload para o Storage)          |
| `lib/supabase/admin.ts`  | Service role, só no servidor, após validação            |
| `lib/supabase/proxy.ts`  | Renovação de sessão e proteção de rotas                 |

## Fuso horário

Horários de atendimento são guardados como hora local do profissional
(`timezone`, padrão `America/Sao_Paulo`); agendamentos são `timestamptz`.
A conversão acontece em um único módulo puro e testado.
