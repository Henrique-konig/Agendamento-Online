const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number) {
  return brl.format(cents / 100);
}

/** "80", "80,5", "1.250,00", "R$ 80,00" → centavos. Retorna null se inválido. */
export function parseBRLToCents(input: string): number | null {
  const cleaned = input.replace(/R\$|\s/g, "");
  if (!cleaned) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(cleaned)) return null;
  const [reais, centavos = ""] = cleaned.replace(/\./g, "").split(",");
  return Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
}

export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

type PriceLike = {
  price_cents: number | null;
  price_is_starting: boolean;
  requires_quote: boolean;
};

export function formatServicePrice(service: PriceLike) {
  if (service.price_cents == null) return service.requires_quote ? "Sob orçamento" : "Sob consulta";
  const value = formatBRL(service.price_cents);
  return service.price_is_starting ? `A partir de ${value}` : value;
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
