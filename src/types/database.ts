// Tipos do banco no formato gerado pelo Supabase CLI.
// Regenere com `npm run db:types` após aplicar novas migrations.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      professionals: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          profession: string;
          timezone: string;
          published: boolean;
          bio: string | null;
          phone: string | null;
          whatsapp: string | null;
          contact_email: string | null;
          instagram: string | null;
          address_line: string | null;
          neighborhood: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          service_area: string | null;
          show_address: boolean;
          avatar_path: string | null;
          cover_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          display_name: string;
          profession: string;
          timezone?: string;
          published?: boolean;
          bio?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          contact_email?: string | null;
          instagram?: string | null;
          address_line?: string | null;
          neighborhood?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          service_area?: string | null;
          show_address?: boolean;
          avatar_path?: string | null;
          cover_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["professionals"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          professional_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price_cents: number | null;
          price_is_starting: boolean;
          requires_quote: boolean;
          active: boolean;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          name: string;
          description?: string | null;
          duration_minutes?: number;
          price_cents?: number | null;
          price_is_starting?: boolean;
          requires_quote?: boolean;
          active?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
      photos: {
        Row: {
          id: string;
          professional_id: string;
          storage_path: string;
          caption: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          storage_path: string;
          caption?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "photos_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
