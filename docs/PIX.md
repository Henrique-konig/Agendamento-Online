# Pagamento antecipado via Pix (opcional)

O profissional decide, **por serviço**, se o agendamento exige um sinal via
Pix (Painel → Serviços → “Exigir pagamento antecipado”). A configuração geral
fica em **Painel → Pagamentos**.

## Fluxo

1. O cliente escolhe o horário e vê o valor do sinal antes de confirmar.
2. O horário fica **reservado** (status pendente) pelo prazo configurado
   (`hold_minutes`), e a página do agendamento mostra o QR Code e o
   “copia e cola”.
3. Pagamento confirmado → agendamento confirmado, e-mails enviados e evento
   mantido na Google Agenda.
4. Prazo vencido sem pagamento → a reserva é cancelada e o horário volta a
   ficar livre (`expire_unpaid_appointments`, executada antes de cada cálculo
   de horários e pelo agendador).

## Modos

|                   | Minha chave Pix                            | Mercado Pago                  |
| ----------------- | ------------------------------------------ | ----------------------------- |
| Configuração      | Chave, nome e cidade                       | Access token de produção      |
| Cobrança          | BR Code estático com valor e identificador | Cobrança dinâmica             |
| Confirmação       | Manual: botão **Pix recebido** na agenda   | Automática via webhook        |
| Custo             | Nenhum                                     | Tarifa do Mercado Pago        |
| E-mail do cliente | Opcional                                   | Obrigatório (exigência do MP) |

### Minha chave Pix

O código segue o _Manual de Padrões para Iniciação do Pix_ do Banco Central
(EMV MPM, CRC16-CCITT) — veja `src/lib/pix/brcode.ts`. O identificador
(`txid`) começa com `AG` seguido do id do agendamento, para o profissional
conferir no extrato.

### Mercado Pago

- Requer `PAYMENT_ENCRYPTION_KEY` (32 bytes em base64). O token de cada
  profissional é validado ao salvar e guardado **criptografado** em
  `pix_settings`, tabela inacessível às chaves públicas.
- Webhook: `POST /api/pix/mercadopago`, informado automaticamente em cada
  cobrança (`notification_url`). O conteúdo da notificação **não é
  confiável**: o status é sempre consultado na API do Mercado Pago com o
  token do profissional, e o `external_reference` precisa bater com o
  agendamento.
- Cobranças usam `X-Idempotency-Key` por agendamento.

## Limitações conhecidas

- Não há estorno automático em cancelamentos de agendamentos pagos.
- Pagamentos feitos depois do prazo (reserva já liberada) não reativam o
  agendamento; o profissional devolve o valor.
