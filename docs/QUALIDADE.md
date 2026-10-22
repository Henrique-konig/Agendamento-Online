# Qualidade, testes e operação

## O que roda no CI (`.github/workflows/ci.yml`)

| Job            | O que garante                                                                      |
| -------------- | ---------------------------------------------------------------------------------- |
| `qualidade`    | lint, tipos, formatação, testes unitários (Vitest) e build                         |
| `banco`        | migrations aplicam do zero e as regras do banco (`prisma/tests/*.sql`) valem       |
| `e2e`          | fluxos reais num navegador: agendar, cancelar, e-mails, senha, PWA, acessibilidade |
| `dependencias` | `npm audit --omit=dev --audit-level=high` sem vulnerabilidades graves              |

Se o `e2e` falhar, o relatório com capturas e _traces_ fica como artefato da execução.

## Testes de ponta a ponta (Playwright)

Cobrem a jornada completa nos dois formatos de tela (celular e desktop):

- **agendamento**: profissional publica a página, cliente agenda, os e-mails saem, o horário
  some para os outros, o cancelamento pelo link libera o horário e avisa o profissional;
  painel exige login e isola os dados de cada conta.
- **senha**: link por e-mail, nova senha, senha antiga deixa de valer, link de uso único e
  resposta idêntica para e-mail inexistente.
- **pwa**: manifest, ícones, service worker, barra de baixo no celular e nenhuma rolagem
  lateral em telas de 320 px.
- **acessibilidade**: `axe-core` (WCAG 2.0/2.1 A e AA) nas páginas públicas e do painel;
  violações sérias ou críticas reprovam.

O e-mail vai para um servidor SMTP de teste (`e2e/support/smtp-sink.mjs`), sem sair da máquina.

### Rodar localmente

```bash
# Postgres local com as migrations aplicadas
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
npm run db:migrate
npm run build        # os testes usam o build de produção
npm run e2e          # ou: npx playwright test e2e/pwa.spec.ts --project=celular
```

Na primeira vez: `npx playwright install chromium`.

## Acessibilidade

As cores de texto secundário (`ink-400` e `ink-500` em `globals.css`) foram escurecidas para
atingir contraste mínimo de 4,5:1 sobre branco e sobre o fundo da página. Ao criar texto em
cinza, use `text-ink-500` ou mais escuro; evite `opacity-*` em texto (reduz o contraste). Para
campos que só valem depois de uma escolha, use `<fieldset disabled>` em vez de apenas
esmaecer.

## Monitoramento

- **Saúde**: `GET /api/health` responde `200 {"status":"ok"}` com o banco no ar e
  `503 {"status":"degraded"}` quando o banco não responde. Cadastre essa URL num monitor
  gratuito (UptimeRobot, Better Stack...) com alerta por e-mail ou WhatsApp.
- **Erros do servidor**: cada erro vira uma linha JSON no log da Vercel com
  `"msg":"request_error"`, o padrão da rota (ex.: `/[slug]/agendamento/[token]`), o método e o
  `digest`. A URL real **não** é registrada, porque contém tokens secretos. Em **Vercel →
  Logs**, busque por `request_error` para ver só os erros.
- Falhas de e-mail aparecem no painel (Início e Notificações) e o cron informa o resultado de
  lembretes e avaliações na resposta.
