import type { Tables } from "@/types/database";

/** Fábricas de dados para testes unitários. */
export function makeProfessional(overrides: Partial<Tables<"professionals">> = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "barbearia-do-ze",
    display_name: "Barbearia do Zé",
    profession: "Barbeiro",
    timezone: "America/Sao_Paulo",
    published: true,
    bio: null,
    phone: null,
    whatsapp: "5551999998888",
    contact_email: null,
    instagram: "barbeariadoze",
    address_line: "Rua A, 10",
    neighborhood: "Centro",
    city: "Porto Alegre",
    state: "RS",
    postal_code: "90000000",
    service_area: null,
    show_address: true,
    avatar_path: null,
    cover_path: null,
    booking_enabled: true,
    auto_confirm: true,
    slot_interval_minutes: 30,
    min_notice_minutes: 120,
    max_days_ahead: 30,
    buffer_minutes: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } satisfies Tables<"professionals">;
}

export function makeService(overrides: Partial<Tables<"services">> = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000010",
    professional_id: "00000000-0000-4000-8000-000000000001",
    name: "Corte",
    description: null,
    duration_minutes: 30,
    price_cents: 4500,
    price_is_starting: false,
    requires_quote: false,
    active: true,
    position: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } satisfies Tables<"services">;
}
