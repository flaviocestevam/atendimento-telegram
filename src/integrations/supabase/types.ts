export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          access_type: string
          content_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          invite_link: string | null
          order_id: string | null
          plan_id: string | null
          revoked_at: string | null
          starts_at: string
          status: string
          telegram_group_id: string | null
          telegram_user_id: string | null
        }
        Insert: {
          access_type: string
          content_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_link?: string | null
          order_id?: string | null
          plan_id?: string | null
          revoked_at?: string | null
          starts_at?: string
          status?: string
          telegram_group_id?: string | null
          telegram_user_id?: string | null
        }
        Update: {
          access_type?: string
          content_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_link?: string | null
          order_id?: string | null
          plan_id?: string | null
          revoked_at?: string | null
          starts_at?: string
          status?: string
          telegram_group_id?: string | null
          telegram_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_telegram_group_id_fkey"
            columns: ["telegram_group_id"]
            isOneToOne: false
            referencedRelation: "telegram_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          telegram_user_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          telegram_user_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          telegram_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          created_at: string
          enable_ai: boolean
          fallback_message: string | null
          id: string
          max_messages_per_user_per_day: number
          model: string
          provider: string
          system_prompt: string | null
          tone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enable_ai?: boolean
          fallback_message?: string | null
          id?: string
          max_messages_per_user_per_day?: number
          model?: string
          provider?: string
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enable_ai?: boolean
          fallback_message?: string | null
          id?: string
          max_messages_per_user_per_day?: number
          model?: string
          provider?: string
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string | null
          name: string
          timing_unit: string | null
          timing_value: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string | null
          name: string
          timing_unit?: string | null
          timing_value?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string | null
          name?: string
          timing_unit?: string | null
          timing_value?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contents: {
        Row: {
          access_duration_days: number | null
          created_at: string
          delivery_payload: string | null
          delivery_type: string
          description: string | null
          id: string
          is_active: boolean
          lifetime_access: boolean
          name: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          access_duration_days?: number | null
          created_at?: string
          delivery_payload?: string | null
          delivery_type: string
          description?: string | null
          id?: string
          is_active?: boolean
          lifetime_access?: boolean
          name: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          access_duration_days?: number | null
          created_at?: string
          delivery_payload?: string | null
          delivery_type?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lifetime_access?: boolean
          name?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          ai_enabled: boolean
          assigned_to: string | null
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          telegram_user_id: string | null
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          assigned_to?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          telegram_user_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          assigned_to?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          telegram_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string | null
          created_at: string
          direction: string
          id: string
          raw_payload: Json | null
          sender_type: string
          telegram_user_id: string | null
          text: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          direction: string
          id?: string
          raw_payload?: Json | null
          sender_type: string
          telegram_user_id?: string | null
          text?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          direction?: string
          id?: string
          raw_payload?: Json | null
          sender_type?: string
          telegram_user_id?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          content_id: string | null
          created_at: string
          id: string
          item_type: string
          paid_at: string | null
          plan_id: string | null
          status: string
          telegram_user_id: string | null
        }
        Insert: {
          amount_cents: number
          content_id?: string | null
          created_at?: string
          id?: string
          item_type: string
          paid_at?: string | null
          plan_id?: string | null
          status?: string
          telegram_user_id?: string | null
        }
        Update: {
          amount_cents?: number
          content_id?: string | null
          created_at?: string
          id?: string
          item_type?: string
          paid_at?: string | null
          plan_id?: string | null
          status?: string
          telegram_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          approved_at: string | null
          created_at: string
          id: string
          method: string
          order_id: string | null
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          provider: string
          provider_payment_id: string | null
          raw_payload: Json | null
          status: string
        }
        Insert: {
          amount_cents: number
          approved_at?: string | null
          created_at?: string
          id?: string
          method?: string
          order_id?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          provider?: string
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          created_at?: string
          id?: string
          method?: string
          order_id?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          provider?: string
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          access_type: string
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          name: string
          post_purchase_message: string | null
          price_cents: number
          telegram_group_id: string | null
          updated_at: string
        }
        Insert: {
          access_type: string
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean
          name: string
          post_purchase_message?: string | null
          price_cents: number
          telegram_group_id?: string | null
          updated_at?: string
        }
        Update: {
          access_type?: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          post_purchase_message?: string | null
          price_cents?: number
          telegram_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_telegram_group_id_fkey"
            columns: ["telegram_group_id"]
            isOneToOne: false
            referencedRelation: "telegram_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_groups: {
        Row: {
          bot_is_admin: boolean
          chat_id: string
          created_at: string
          default_invite_link: string | null
          id: string
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          bot_is_admin?: boolean
          chat_id: string
          created_at?: string
          default_invite_link?: string | null
          id?: string
          name: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          bot_is_admin?: boolean
          chat_id?: string
          created_at?: string
          default_invite_link?: string | null
          id?: string
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_blocked: boolean
          language_code: string | null
          last_name: string | null
          telegram_id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_blocked?: boolean
          language_code?: string | null
          last_name?: string | null
          telegram_id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_blocked?: boolean
          language_code?: string | null
          last_name?: string | null
          telegram_id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "agent"],
    },
  },
} as const
