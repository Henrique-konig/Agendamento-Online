# Lembretes e notificações

## O que é enviado

| Evento                                      | Para                         | Canal                             |
| ------------------------------------------- | ---------------------------- | --------------------------------- |
| Novo agendamento                            | Cliente (se informou e-mail) | E-mail com link para ver/cancelar |
| Novo agendamento / cancelamento / orçamento | Profissional                 | E-mail                            |
| Dia anterior ao atendimento                 | Cliente                      | E-mail e/ou WhatsApp              |

Cada profissional liga e desliga os canais em **Painel → Notificações**, onde
também vê o histórico dos últimos envios (`notification_log`).

## E-mail

O envio usa **SMTP** (qualquer provedor) ou, como alternativa, a API do Resend.
Se `SMTP_HOST`, `SMTP_USER` e `SMTP_PASSWORD` existirem, o SMTP é usado. Sem eles,
vale o Resend. Sem nenhum dos dois, o sistema funciona normalmente e o histórico
em **Painel → Notificações** registra "não enviado".

Os mesmos e-mails servem para: confirmação ao cliente, avisos ao profissional,
lembrete do dia anterior e **recuperação de senha** (`/esqueci-senha`).

### Opção A — Gmail (sem domínio, mais rápido)

1. Na conta Google: **Segurança → Verificação em duas etapas** (ative).
2. Em <https://myaccount.google.com/apppasswords>, crie uma **senha de app**
   (16 letras) com o nome "Agenda".
3. Na Vercel, defina:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=seuemail@gmail.com
   SMTP_PASSWORD=<a senha de app, sem espaços>
   EMAIL_FROM=Agenda Autônomo <seuemail@gmail.com>
   ```

Limites: cerca de 500 e-mails por dia, e o Google mostra o seu Gmail como remetente.

### Opção B — Brevo (conta própria de envio, mais profissional)

1. Crie conta em <https://brevo.com> (plano grátis: 300 e-mails/dia).
2. Em **Senders, Domains & IPs → Senders**, cadastre e confirme o e-mail remetente.
3. Em **SMTP & API → SMTP**, copie o login e crie uma **chave SMTP**.
4. Na Vercel, defina:

   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<login SMTP do Brevo>
   SMTP_PASSWORD=<chave SMTP>
   EMAIL_FROM=Agenda Autônomo <o-email-remetente-confirmado>
   ```

### Opção C — Resend

Crie a chave em <https://resend.com>, verifique um domínio e defina
`RESEND_API_KEY` e `EMAIL_FROM` (`Agenda <nao-responda@seudominio.com.br>`). Sem
domínio verificado, o Resend só entrega ao e-mail da própria conta.

Depois de mudar variáveis na Vercel, faça um **Redeploy**.

### Recuperação de senha

`/esqueci-senha` envia um link válido por 1 hora e de uso único (só o hash vai para
o banco). Trocar a senha encerra as sessões abertas. A resposta é a mesma exista
a conta ou não, e há limite de pedidos por e-mail e por IP.

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
