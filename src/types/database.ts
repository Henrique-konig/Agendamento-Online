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
          booking_enabled: boolean;
          auto_confirm: boolean;
          slot_interval_minutes: number;
          min_notice_minutes: number;
          max_days_ahead: number;
          buffer_minutes: number;
          notification_email: string | null;
          notify_new_booking: boolean;
          reminder_email: boolean;
          reminder_whatsapp: boolean;
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
          booking_enabled?: boolean;
          auto_confirm?: boolean;
          slot_interval_minutes?: number;
          min_notice_minutes?: number;
          max_days_ahead?: number;
          buffer_minutes?: number;
          notification_email?: string | null;
          notify_new_booking?: boolean;
          reminder_email?: boolean;
          reminder_whatsapp?: boolean;
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
      availability_rules: {
        Row: {
          id: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_rules"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "availability_rules_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
      time_off: {
        Row: {
          id: string;
          professional_id: string;
          starts_at: string;
          ends_at: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          starts_at: string;
          ends_at: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["time_off"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "time_off_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          professional_id: string;
          name: string;
          phone: string;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          name: string;
          phone: string;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clients_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          professional_id: string;
          client_id: string;
          service_id: string | null;
          service_name: string;
          price_cents: number | null;
          starts_at: string;
          ends_at: string;
          status: Database["public"]["Enums"]["appointment_status"];
          notes: string | null;
          source: "online" | "painel";
          cancel_token: string;
          cancelled_at: string | null;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          client_id: string;
          service_id?: string | null;
          service_name: string;
          price_cents?: number | null;
          starts_at: string;
          ends_at: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          notes?: string | null;
          source?: "online" | "painel";
          cancel_token?: string;
          cancelled_at?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_requests: {
        Row: {
          id: string;
          professional_id: string;
          client_id: string | null;
          service_id: string | null;
          service_name: string | null;
          name: string;
          phone: string;
          email: string | null;
          description: string;
          location: string | null;
          preferred_period: string | null;
          status: Database["public"]["Enums"]["quote_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          client_id?: string | null;
          service_id?: string | null;
          service_name?: string | null;
          name: string;
          phone: string;
          email?: string | null;
          description: string;
          location?: string | null;
          preferred_period?: string | null;
          status?: Database["public"]["Enums"]["quote_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "quote_requests_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_requests_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_requests_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_log: {
        Row: {
          id: string;
          professional_id: string;
          appointment_id: string | null;
          quote_id: string | null;
          kind: string;
          channel: Database["public"]["Enums"]["notification_channel"];
          recipient: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          provider_id: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          appointment_id?: string | null;
          quote_id?: string | null;
          kind: string;
          channel: Database["public"]["Enums"]["notification_channel"];
          recipient?: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          provider_id?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_log"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "notification_log_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      replace_availability: {
        Args: { rules: Json };
        Returns: undefined;
      };
    };
    Enums: {
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
      quote_status: "new" | "contacted" | "scheduled" | "closed";
      notification_channel: "email" | "whatsapp";
      notification_status: "sent" | "failed" | "skipped";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
