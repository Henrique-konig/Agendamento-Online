export type NavItem = { href: string; label: string };

/** Itens do menu lateral do painel. Cada etapa do MVP acrescenta os seus. */
export const painelNav: NavItem[] = [
  { href: "/painel", label: "Início" },
  { href: "/painel/agenda", label: "Agenda" },
  { href: "/painel/clientes", label: "Clientes" },
  { href: "/painel/orcamentos", label: "Orçamentos" },
  { href: "/painel/horarios", label: "Horários" },
  { href: "/painel/bloqueios", label: "Bloqueios" },
  { href: "/painel/servicos", label: "Serviços" },
  { href: "/painel/perfil", label: "Perfil" },
  { href: "/painel/fotos", label: "Fotos" },
];
