# Integração com Google Agenda

## O que faz

- **Bloqueia horários**: compromissos da Google Agenda do profissional
  (consulta _free/busy_ — apenas livre/ocupado, sem ler o conteúdo) somem dos
  horários oferecidos aos clientes.
- **Cria eventos**: cada novo agendamento vira um evento na agenda do
  profissional, com nome e WhatsApp do cliente; cancelamentos removem o evento.

Falhas no Google nunca impedem um agendamento: o erro é registrado e exibido
em **Painel → Integrações**.

## Configuração (uma vez por instalação)

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um
   projeto e ative a **Google Calendar API**.
2. Em **Tela de consentimento OAuth**, configure o app (tipo _Externo_) com os
   escopos:
   - `openid`, `email`
   - `https://www.googleapis.com/auth/calendar.freebusy`
   - `https://www.googleapis.com/auth/calendar.events`

   Enquanto o app estiver em _Teste_, adicione os e-mails dos profissionais
   como usuários de teste (tokens de apps em teste expiram em 7 dias). Para
   produção, publique o app e conclua a verificação do Google.

3. Em **Credenciais**, crie um _ID do cliente OAuth_ do tipo **Aplicativo
   da Web** com o URI de redirecionamento
   `<NEXT_PUBLIC_SITE_URL>/api/google/callback`.
4. Defina as variáveis:

   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
   ```

## Segurança

- Os tokens OAuth ficam em `google_connections`, **criptografados com
  AES-256-GCM** pela aplicação. A tabela não é acessível pelas chaves
  `anon`/`authenticated` — apenas pelo servidor.
- O fluxo OAuth usa `state` aleatório vinculado ao usuário e guardado em
  cookie `httpOnly` (proteção contra CSRF).
- Ao desconectar, o token é revogado no Google e apagado do banco.
- Trocar `GOOGLE_TOKEN_ENCRYPTION_KEY` invalida as conexões existentes
  (os profissionais precisam reconectar).
