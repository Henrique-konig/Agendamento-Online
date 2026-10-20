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
- **Segurança em camadas**: o `proxy.ts` redireciona visitantes sem cookie
  para fora do painel; páginas e Server Actions validam a sessão no banco e
  filtram tudo por `professional_id`; o banco garante as invariantes
  (horários sem sobreposição, formatos).
- **Visitantes não têm acesso direto a dados privados**. Ações públicas
  (reservar, pedir orçamento) passam por Server Actions que validam a entrada
  com Zod.

## Dados e autenticação

| Arquivo                | Papel                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| `lib/db.ts`            | Cliente Prisma (adapter `pg`), criado no primeiro uso                 |
| `lib/auth/session.ts`  | Sessão: token aleatório no cookie, hash SHA-256 no banco              |
| `lib/auth/password.ts` | Senhas com bcrypt (custo 12)                                          |
| `lib/auth.ts`          | `requireUser` / `requireProfessional` para páginas e Server Actions   |
| `proxy.ts`             | Barreira leve: sem cookie de sessão, `/painel` redireciona para login |
| `lib/db-errors.ts`     | Traduz erros do Postgres (23505 duplicado, 23P01 horário sobreposto)  |

**Autorização:** sem RLS, é o código que isola os dados. Todo acesso do painel
passa por `requireProfessional()` e filtra por `professional_id`. Ações
públicas (reservar, pedir orçamento) validam a entrada com Zod e só tocam o
profissional identificado pelo `slug`.

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

## Integrações externas

- **Google Agenda** (`features/google/`): uma fonte de ocupados a mais em
  `busySources` e um ouvinte em `features/booking/notify.ts` que cria/remove
  eventos. Tokens criptografados (`lib/crypto/secretbox.ts`). Veja
  [`GOOGLE-AGENDA.md`](GOOGLE-AGENDA.md).
- **Notificações** (`features/notifications/`): outro ouvinte do mesmo
  barramento. Veja [`LEMBRETES.md`](LEMBRETES.md).
- **Pix** (`features/payments/`): cobrança gerada logo após a reserva;
  confirmação manual ou por webhook emite o evento `paid`. Veja
  [`PIX.md`](PIX.md).

Integrações são opcionais: sem as variáveis de ambiente, ficam desligadas e o
restante do sistema funciona normalmente.
