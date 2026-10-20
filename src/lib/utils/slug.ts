/** Converte um texto livre em slug: "Barbearia do Zé" → "barbearia-do-ze". */
export function slugify(input: string, maxLength = 40) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export const RESERVED_SLUGS = new Set([
  "api",
  "painel",
  "entrar",
  "cadastro",
  "sair",
  "auth",
  "admin",
  "precos",
  "termos",
  "privacidade",
  "ajuda",
  "suporte",
  "www",
  "app",
]);

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}
