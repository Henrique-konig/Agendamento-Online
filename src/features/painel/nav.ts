import type { IconName } from "@/components/ui/icon";

export type NavItem = { href: string; label: string; icon: IconName };
export type NavGroup = { label?: string; items: NavItem[] };

/** Menu do painel, agrupado por tarefa: o dia a dia, a configuração e as integrações. */
export const painelNav: NavGroup[] = [
  {
    items: [
      { href: "/painel", label: "Início", icon: "home" },
      { href: "/painel/agenda", label: "Agenda", icon: "calendar" },
      { href: "/painel/clientes", label: "Clientes", icon: "users" },
      { href: "/painel/orcamentos", label: "Orçamentos", icon: "file" },
    ],
  },
  {
    label: "Sua página",
    items: [
      { href: "/painel/servicos", label: "Serviços", icon: "tag" },
      { href: "/painel/perfil", label: "Perfil", icon: "user" },
      { href: "/painel/fotos", label: "Fotos", icon: "image" },
    ],
  },
  {
    label: "Atendimento",
    items: [
      { href: "/painel/horarios", label: "Horários", icon: "clock" },
      { href: "/painel/bloqueios", label: "Bloqueios", icon: "block" },
      { href: "/painel/relatorios", label: "Relatórios", icon: "chart" },
    ],
  },
  {
    label: "Conexões",
    items: [
      { href: "/painel/notificacoes", label: "Notificações", icon: "bell" },
      { href: "/painel/integracoes", label: "Integrações", icon: "plug" },
      { href: "/painel/pagamentos", label: "Pagamentos", icon: "pix" },
    ],
  },
];
