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

## Agendamento

1. `lib/scheduling/slots.ts` (puro, testado) gera os horários livres a partir
   das faixas de atendimento, da duração do serviço, do intervalo, da
   antecedência mínima e da folga entre atendimentos.
2. Os horários ocupados vêm de **fontes** em `features/booking/busy.ts`
   (agendamentos ativos e bloqueios). Integrações externas entram como novas
   fontes, sem mexer no cálculo.
3. Ao confirmar, o servidor recalcula a disponibilidade daquele horário e o
   banco garante com uma **exclusion constraint** (`appointments_no_overlap`)
   que dois compromissos ativos nunca se sobreponham — mesmo com duas reservas
   simultâneas.
4. O cliente recebe um link secreto (`cancel_token`) para consultar, adicionar
   ao calendário (.ics / Google) ou cancelar.
5. `features/booking/notify.ts` dispara ganchos após criar/cancelar
   (notificações, sincronização), executados com `after()` para não atrasar a
   resposta.
