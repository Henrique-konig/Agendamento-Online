/** Formatadores de data/hora em pt-BR para um fuso específico. */
export function dateFormatters(timeZone: string) {
  const make = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone, ...options });

  const time = make({ hour: "2-digit", minute: "2-digit" });
  const long = make({ weekday: "long", day: "numeric", month: "long" });
  const short = make({ day: "2-digit", month: "2-digit" });
  const weekdayShort = make({ weekday: "short" });
  const full = make({ weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return {
    time: (d: Date | string) => time.format(new Date(d)),
    long: (d: Date | string) => long.format(new Date(d)),
    short: (d: Date | string) => short.format(new Date(d)),
    weekdayShort: (d: Date | string) => weekdayShort.format(new Date(d)).replace(".", ""),
    full: (d: Date | string) => full.format(new Date(d)),
  };
}

/** Meio-dia UTC de uma data local — seguro para formatar só a data em qualquer fuso do Brasil. */
export function localDateAnchor(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
