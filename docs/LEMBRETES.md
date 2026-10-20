# Lembretes e notificações

## O que é enviado

| Evento                                      | Para                         | Canal                             |
| ------------------------------------------- | ---------------------------- | --------------------------------- |
| Novo agendamento                            | Cliente (se informou e-mail) | E-mail com link para ver/cancelar |
| Novo agendamento / cancelamento / orçamento | Profissional                 | E-mail                            |
| Dia anterior ao atendimento                 | Cliente                      | E-mail e/ou WhatsApp              |

Cada profissional liga e desliga os canais em **Painel → Notificações**, onde
também vê o histórico dos últimos envios (`notification_log`).

## E-mail (Resend)

1. Crie uma conta em <https://resend.com> e verifique o domínio do remetente.
2. Defina `RESEND_API_KEY` e `EMAIL_FROM` (ex.: `Agenda <nao-responda@seudominio.com.br>`).

Os envios usam chave de idempotência por agendamento, então reprocessar um
evento não duplica e-mails.

## WhatsApp (Cloud API da Meta)

Mensagens iniciadas pela empresa exigem um **template aprovado**.

1. Crie um app em <https://developers.facebook.com>, adicione o produto
   WhatsApp e registre o número da plataforma.
2. Crie o template `lembrete_agendamento` (categoria **Utilidade**, idioma
   `pt_BR`) com o corpo:

   ```
   Olá, {{1}}! Lembrete do seu horário de {{2}} com {{3}}: {{4}}.
   Para ver detalhes ou cancelar: {{5}}
   ```

3. Defina `WHATSAPP_TOKEN` (token permanente de usuário do sistema) e
   `WHATSAPP_PHONE_NUMBER_ID`.

O envio usa um número único da plataforma; cada profissional apenas ativa o
canal. Custos de conversa da Meta se aplicam.

## Agendador

`vercel.json` agenda `GET /api/cron/lembretes` todos os dias às 21:00 UTC
(18:00 em Brasília). A Vercel envia `Authorization: Bearer $CRON_SECRET`
automaticamente; defina `CRON_SECRET` (16+ caracteres) no projeto.

A seleção usa o fuso de cada profissional: entram os agendamentos
confirmados cuja data local é **amanhã** e que ainda não receberam lembrete.
Cada agendamento é reivindicado (`reminder_sent_at`) antes do envio, então
rodar o agendador mais vezes (plano Pro) ou manualmente nunca duplica.

Teste manual:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/lembretes
```
