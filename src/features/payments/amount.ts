/** Valor do sinal em centavos, arredondado para cima ao real inteiro quando parcial. */
export function depositAmountCents(priceCents: number, percent: number) {
  if (priceCents <= 0) return 0;
  if (percent >= 100) return priceCents;
  return Math.max(100, Math.ceil((priceCents * percent) / 100 / 100) * 100);
}
