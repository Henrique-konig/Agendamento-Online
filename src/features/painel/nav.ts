export type NavItem = { href: string; label: string };

/** Itens do menu lateral do painel. Cada etapa do MVP acrescenta os seus. */
export const painelNav: NavItem[] = [
  { href: "/painel", label: "Início" },
  { href: "/painel/perfil", label: "Perfil" },
  { href: "/painel/servicos", label: "Serviços" },
  { href: "/painel/fotos", label: "Fotos" },
];
