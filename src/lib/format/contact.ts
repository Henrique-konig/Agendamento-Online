/** Mantém apenas dígitos. */
export function digits(value: string) {
  return value.replace(/\D/g, "");
}

/** Normaliza um celular brasileiro para o formato E.164 sem "+": 55DDXXXXXXXXX. */
export function normalizeBrazilianPhone(value: string): string | null {
  let d = digits(value);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (!/^55\d{10,11}$/.test(d)) return null;
  return d;
}

export function whatsappLink(number: string, text?: string) {
  const url = new URL(`https://wa.me/${digits(number)}`);
  if (text) url.searchParams.set("text", text);
  return url.toString();
}

export function formatPhoneBR(value: string) {
  const d = digits(value).replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}
