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
      ai_learnings: {
        Row: {
          content: string
          created_at: string
          evidence: Json
          id: string
          kind: string
          status: Database["public"]["Enums"]["learning_status"]
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          evidence?: Json
          id?: string
          kind: string
          status?: Database["public"]["Enums"]["learning_status"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          evidence?: Json
          id?: string
          kind?: string
          status?: Database["public"]["Enums"]["learning_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          cost_estimate_cents: number
          created_at: string
          enable_ai: boolean
          fallback_message: string | null
          grok_global_mode: Database["public"]["Enums"]["grok_global_mode"]
          id: string
          max_messages_per_user_per_day: number
          messages_today: number
          model: string
          provider: string
          seller_profile: Json
          system_prompt: string | null
          tone: string | null
          updated_at: string
          xai_api_key_set: boolean
        }
        Insert: {
          cost_estimate_cents?: number
          created_at?: string
          enable_ai?: boolean
          fallback_message?: string | null
          grok_global_mode?: Database["public"]["Enums"]["grok_global_mode"]
          id?: string
          max_messages_per_user_per_day?: number
          messages_today?: number
          model?: string
          provider?: string
          seller_profile?: Json
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
          xai_api_key_set?: boolean
        }
        Update: {
          cost_estimate_cents?: number
          created_at?: string
          enable_ai?: boolean
          fallback_message?: string | null
          grok_global_mode?: Database["public"]["Enums"]["grok_global_mode"]
          id?: string
          max_messages_per_user_per_day?: number
          messages_today?: number
          model?: string
          provider?: string
          seller_profile?: Json
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
          xai_api_key_set?: boolean
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          actions: Json
          created_at: string
          id: string
          is_active: boolean
          message: string | null
          name: string
          timing_unit: string | null
          timing_value: number | null
          trigger: Database["public"]["Enums"]["automation_trigger"] | null
          type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string | null
          name: string
          timing_unit?: string | null
          timing_value?: number | null
          trigger?: Database["public"]["Enums"]["automation_trigger"] | null
          type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string | null
          name?: string
          timing_unit?: string | null
          timing_value?: number | null
          trigger?: Database["public"]["Enums"]["automation_trigger"] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cakto_events: {
        Row: {
          action: Database["public"]["Enums"]["cakto_event_action"]
          amount: number | null
          buyer_email: string | null
          cakto_payment_id: string | null
          created_at: string
          external_reference: string | null
          id: string
          linked_payment_id: string | null
          notes: string | null
          payload: Json
          received_at: string
          status: string | null
          updated_at: string
        }
        Insert: {
          action?: Database["public"]["Enums"]["cakto_event_action"]
          amount?: number | null
          buyer_email?: string | null
          cakto_payment_id?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          linked_payment_id?: string | null
          notes?: string | null
          payload: Json
          received_at?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["cakto_event_action"]
          amount?: number | null
          buyer_email?: string | null
          cakto_payment_id?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          linked_payment_id?: string | null
          notes?: string | null
          payload?: Json
          received_at?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cakto_events_linked_payment_id_fkey"
            columns: ["linked_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          access_duration_days: number | null
          cakto_checkout_url: string | null
          cakto_offer_id: string | null
          created_at: string
          delivery_payload: string | null
          delivery_type: string
          description: string | null
          external_reference: string | null
          grok_can_offer: boolean
          id: string
          is_active: boolean
          lifetime_access: boolean
          name: string
          post_purchase_message: string | null
          price_cents: number
          tags: string[]
          updated_at: string
          upsell_content_id: string | null
        }
        Insert: {
          access_duration_days?: number | null
          cakto_checkout_url?: string | null
          cakto_offer_id?: string | null
          created_at?: string
          delivery_payload?: string | null
          delivery_type: string
          description?: string | null
          external_reference?: string | null
          grok_can_offer?: boolean
          id?: string
          is_active?: boolean
          lifetime_access?: boolean
          name: string
          post_purchase_message?: string | null
          price_cents: number
          tags?: string[]
          updated_at?: string
          upsell_content_id?: string | null
        }
        Update: {
          access_duration_days?: number | null
          cakto_checkout_url?: string | null
          cakto_offer_id?: string | null
          created_at?: string
          delivery_payload?: string | null
          delivery_type?: string
          description?: string | null
          external_reference?: string | null
          grok_can_offer?: boolean
          id?: string
          is_active?: boolean
          lifetime_access?: boolean
          name?: string
          post_purchase_message?: string | null
          price_cents?: number
          tags?: string[]
          updated_at?: string
          upsell_content_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_upsell_content_id_fkey"
            columns: ["upsell_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_enabled: boolean
          assigned_to: string | null
          created_at: string
          current_funnel_id: string | null
          current_step: number | null
          current_story_id: string | null
          grok_mode: Database["public"]["Enums"]["grok_conv_mode"]
          id: string
          last_interaction_at: string | null
          last_message_at: string | null
          needs_human: boolean
          score_buy: number
          score_relationship: number
          status: string
          telegram_user_id: string | null
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          assigned_to?: string | null
          created_at?: string
          current_funnel_id?: string | null
          current_step?: number | null
          current_story_id?: string | null
          grok_mode?: Database["public"]["Enums"]["grok_conv_mode"]
          id?: string
          last_interaction_at?: string | null
          last_message_at?: string | null
          needs_human?: boolean
          score_buy?: number
          score_relationship?: number
          status?: string
          telegram_user_id?: string | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          assigned_to?: string | null
          created_at?: string
          current_funnel_id?: string | null
          current_step?: number | null
          current_story_id?: string | null
          grok_mode?: Database["public"]["Enums"]["grok_conv_mode"]
          id?: string
          last_interaction_at?: string | null
          last_message_at?: string | null
          needs_human?: boolean
          score_buy?: number
          score_relationship?: number
          status?: string
          telegram_user_id?: string | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
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
      funnel_leads: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          entered_at: string
          funnel_id: string
          id: string
          last_step_at: string | null
          lead_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          entered_at?: string
          funnel_id: string
          id?: string
          last_step_at?: string | null
          lead_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          entered_at?: string
          funnel_id?: string
          id?: string
          last_step_at?: string | null
          lead_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string
          description: string | null
          goal: string | null
          ia_can_create_checkout: boolean
          ia_mode: Database["public"]["Enums"]["ia_mode"]
          ia_requires_approval: boolean
          id: string
          metrics: Json
          name: string
          status: string
          steps: Json
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal?: string | null
          ia_can_create_checkout?: boolean
          ia_mode?: Database["public"]["Enums"]["ia_mode"]
          ia_requires_approval?: boolean
          id?: string
          metrics?: Json
          name: string
          status?: string
          steps?: Json
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goal?: string | null
          ia_can_create_checkout?: boolean
          ia_mode?: Database["public"]["Enums"]["ia_mode"]
          ia_requires_approval?: boolean
          id?: string
          metrics?: Json
          name?: string
          status?: string
          steps?: Json
          type?: string | null
          updated_at?: string
        }
        Relationships: []
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
      memories: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["memory_kind"]
          lead_id: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["memory_kind"]
          lead_id: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["memory_kind"]
          lead_id?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string | null
          created_at: string
          direction: string
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          payload: Json
          raw_payload: Json | null
          sender: Database["public"]["Enums"]["message_sender"]
          sender_type: string
          telegram_user_id: string | null
          text: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          direction: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          payload?: Json
          raw_payload?: Json | null
          sender?: Database["public"]["Enums"]["message_sender"]
          sender_type: string
          telegram_user_id?: string | null
          text?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          direction?: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          payload?: Json
          raw_payload?: Json | null
          sender?: Database["public"]["Enums"]["message_sender"]
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
      objections: {
        Row: {
          confidence: number
          conversation_id: string | null
          converted_after: boolean
          created_at: string
          id: string
          lead_id: string
          status: Database["public"]["Enums"]["objection_status"]
          suggested_reply: string | null
          type: Database["public"]["Enums"]["objection_type"]
          updated_at: string
        }
        Insert: {
          confidence?: number
          conversation_id?: string | null
          converted_after?: boolean
          created_at?: string
          id?: string
          lead_id: string
          status?: Database["public"]["Enums"]["objection_status"]
          suggested_reply?: string | null
          type?: Database["public"]["Enums"]["objection_type"]
          updated_at?: string
        }
        Update: {
          confidence?: number
          conversation_id?: string | null
          converted_after?: boolean
          created_at?: string
          id?: string
          lead_id?: string
          status?: Database["public"]["Enums"]["objection_status"]
          suggested_reply?: string | null
          type?: Database["public"]["Enums"]["objection_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objections_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          cakto_order_id: string | null
          content_id: string | null
          created_at: string
          external_reference: string | null
          id: string
          item_type: string
          paid_at: string | null
          plan_id: string | null
          status: string
          telegram_user_id: string | null
        }
        Insert: {
          amount_cents: number
          cakto_order_id?: string | null
          content_id?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          item_type: string
          paid_at?: string | null
          plan_id?: string | null
          status?: string
          telegram_user_id?: string | null
        }
        Update: {
          amount_cents?: number
          cakto_order_id?: string | null
          content_id?: string | null
          created_at?: string
          external_reference?: string | null
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
          cakto_order_id: string | null
          cakto_payment_id: string | null
          checkout_url: string | null
          created_at: string
          event_payload: Json | null
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
          cakto_order_id?: string | null
          cakto_payment_id?: string | null
          checkout_url?: string | null
          created_at?: string
          event_payload?: Json | null
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
          cakto_order_id?: string | null
          cakto_payment_id?: string | null
          checkout_url?: string | null
          created_at?: string
          event_payload?: Json | null
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
          cakto_checkout_url: string | null
          cakto_offer_id: string | null
          created_at: string
          description: string | null
          duration_days: number
          external_reference: string | null
          grok_can_offer: boolean
          id: string
          is_active: boolean
          name: string
          post_purchase_message: string | null
          price_cents: number
          renewal_message: string | null
          telegram_group_id: string | null
          updated_at: string
        }
        Insert: {
          access_type: string
          cakto_checkout_url?: string | null
          cakto_offer_id?: string | null
          created_at?: string
          description?: string | null
          duration_days: number
          external_reference?: string | null
          grok_can_offer?: boolean
          id?: string
          is_active?: boolean
          name: string
          post_purchase_message?: string | null
          price_cents: number
          renewal_message?: string | null
          telegram_group_id?: string | null
          updated_at?: string
        }
        Update: {
          access_type?: string
          cakto_checkout_url?: string | null
          cakto_offer_id?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          external_reference?: string | null
          grok_can_offer?: boolean
          id?: string
          is_active?: boolean
          name?: string
          post_purchase_message?: string | null
          price_cents?: number
          renewal_message?: string | null
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
      quick_replies: {
        Row: {
          active: boolean
          body: string
          category: Database["public"]["Enums"]["quick_reply_category"]
          conversions: number
          created_at: string
          id: string
          title: string
          type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          active?: boolean
          body: string
          category?: Database["public"]["Enums"]["quick_reply_category"]
          conversions?: number
          created_at?: string
          id?: string
          title: string
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          active?: boolean
          body?: string
          category?: Database["public"]["Enums"]["quick_reply_category"]
          conversions?: number
          created_at?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      seller_profile: {
        Row: {
          allow_typos: boolean
          avatar_url: string | null
          away_message: string | null
          bio: string | null
          commercial_rules: string | null
          created_at: string
          display_name: string
          emotional_rules: string | null
          forbidden_promises: string[]
          hours: Json
          id: string
          informality: number
          language: string
          priority_products: string[]
          public_description: string | null
          return_message: string | null
          short_messages: boolean
          split_messages: boolean
          typo_rate: number
          updated_at: string
          use_pauses: boolean
          use_slang: boolean
          voice_tone: string | null
        }
        Insert: {
          allow_typos?: boolean
          avatar_url?: string | null
          away_message?: string | null
          bio?: string | null
          commercial_rules?: string | null
          created_at?: string
          display_name?: string
          emotional_rules?: string | null
          forbidden_promises?: string[]
          hours?: Json
          id?: string
          informality?: number
          language?: string
          priority_products?: string[]
          public_description?: string | null
          return_message?: string | null
          short_messages?: boolean
          split_messages?: boolean
          typo_rate?: number
          updated_at?: string
          use_pauses?: boolean
          use_slang?: boolean
          voice_tone?: string | null
        }
        Update: {
          allow_typos?: boolean
          avatar_url?: string | null
          away_message?: string | null
          bio?: string | null
          commercial_rules?: string | null
          created_at?: string
          display_name?: string
          emotional_rules?: string | null
          forbidden_promises?: string[]
          hours?: Json
          id?: string
          informality?: number
          language?: string
          priority_products?: string[]
          public_description?: string | null
          return_message?: string | null
          short_messages?: boolean
          split_messages?: boolean
          typo_rate?: number
          updated_at?: string
          use_pauses?: boolean
          use_slang?: boolean
          voice_tone?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          category: Database["public"]["Enums"]["story_category"]
          commercial_goal: string | null
          created_at: string
          description: string | null
          emotional_angle: string | null
          ia_mode: Database["public"]["Enums"]["ia_mode"]
          id: string
          main_angle: string | null
          main_content_id: string | null
          main_plan_id: string | null
          metrics: Json
          name: string
          status: string
          steps: Json
          updated_at: string
          upsell_content_id: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["story_category"]
          commercial_goal?: string | null
          created_at?: string
          description?: string | null
          emotional_angle?: string | null
          ia_mode?: Database["public"]["Enums"]["ia_mode"]
          id?: string
          main_angle?: string | null
          main_content_id?: string | null
          main_plan_id?: string | null
          metrics?: Json
          name: string
          status?: string
          steps?: Json
          updated_at?: string
          upsell_content_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["story_category"]
          commercial_goal?: string | null
          created_at?: string
          description?: string | null
          emotional_angle?: string | null
          ia_mode?: Database["public"]["Enums"]["ia_mode"]
          id?: string
          main_angle?: string | null
          main_content_id?: string | null
          main_plan_id?: string | null
          metrics?: Json
          name?: string
          status?: string
          steps?: Json
          updated_at?: string
          upsell_content_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_main_content_id_fkey"
            columns: ["main_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_main_plan_id_fkey"
            columns: ["main_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_upsell_content_id_fkey"
            columns: ["upsell_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      story_leads: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          entered_at: string
          id: string
          last_step_at: string | null
          lead_id: string
          status: string
          story_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          entered_at?: string
          id?: string
          last_step_at?: string | null
          lead_id: string
          status?: string
          story_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          entered_at?: string
          id?: string
          last_step_at?: string | null
          lead_id?: string
          status?: string
          story_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_leads_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
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
          last_purchase_at: string | null
          origin: string | null
          score_buy: number
          score_relationship: number
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[]
          telegram_id: string
          temperature: Database["public"]["Enums"]["lead_temperature"]
          total_spent: number
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
          last_purchase_at?: string | null
          origin?: string | null
          score_buy?: number
          score_relationship?: number
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          telegram_id: string
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          total_spent?: number
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
          last_purchase_at?: string | null
          origin?: string | null
          score_buy?: number
          score_relationship?: number
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          telegram_id?: string
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          total_spent?: number
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
      automation_trigger:
        | "new_lead"
        | "start_command"
        | "checkout_sent"
        | "checkout_pending_10m"
        | "checkout_pending_1h"
        | "payment_approved"
        | "content_delivered"
        | "access_granted"
        | "subscription_expiring"
        | "subscription_expired"
        | "lead_no_reply"
        | "lead_moved_funnel"
        | "lead_moved_story"
        | "grok_paused"
        | "grok_activated"
      cakto_event_action: "pending" | "linked" | "reprocessed" | "ignored"
      content_delivery:
        | "text"
        | "link"
        | "file"
        | "image"
        | "video"
        | "audio"
        | "private_area"
      grok_conv_mode: "inherit" | "off" | "suggest" | "auto"
      grok_global_mode: "off" | "suggest" | "auto_per_funnel" | "auto_all"
      ia_mode: "off" | "suggest" | "auto"
      lead_status:
        | "new"
        | "in_conversation"
        | "awaiting_reply"
        | "checkout_sent"
        | "pix_pending"
        | "buyer"
        | "subscriber_active"
        | "subscription_expired"
        | "in_funnel"
        | "in_story"
        | "ready_upsell"
        | "inactive"
        | "blocked"
      lead_temperature: "cold" | "warm" | "hot"
      learning_status: "pending" | "approved" | "rejected"
      memory_kind: "commercial" | "emotional"
      message_kind:
        | "text"
        | "audio"
        | "file"
        | "image"
        | "video"
        | "link"
        | "checkout"
        | "offer"
        | "system"
      message_sender: "lead" | "admin" | "bot" | "automation" | "grok"
      objection_status: "open" | "handled" | "dismissed"
      objection_type:
        | "preco"
        | "desconfianca"
        | "vou_pensar"
        | "nao_entendi"
        | "sem_pix_agora"
        | "pedido_desconto"
        | "nao_sei_se_e_pra_mim"
        | "comparando"
        | "problema_pagamento"
        | "quer_humano"
        | "garantia"
        | "momento_ruim"
        | "medo_nao_receber"
        | "outra"
      payment_status:
        | "pending"
        | "checkout_sent"
        | "approved"
        | "cancelled"
        | "expired"
        | "failed"
        | "refunded"
      quick_reply_category:
        | "boas_vindas"
        | "como_funciona"
        | "preco"
        | "pagamento"
        | "checkout_cakto"
        | "acesso_grupo"
        | "entrega_conteudo"
        | "suporte"
        | "pix_pendente"
        | "pos_compra"
        | "renovacao"
        | "upsell"
        | "objecao"
        | "outro"
      story_category:
        | "curiosidade"
        | "proximidade"
        | "bastidores"
        | "transformacao"
        | "confianca"
        | "urgencia_natural"
        | "reativacao"
        | "upsell"
        | "educacao"
        | "relacionamento"
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
      automation_trigger: [
        "new_lead",
        "start_command",
        "checkout_sent",
        "checkout_pending_10m",
        "checkout_pending_1h",
        "payment_approved",
        "content_delivered",
        "access_granted",
        "subscription_expiring",
        "subscription_expired",
        "lead_no_reply",
        "lead_moved_funnel",
        "lead_moved_story",
        "grok_paused",
        "grok_activated",
      ],
      cakto_event_action: ["pending", "linked", "reprocessed", "ignored"],
      content_delivery: [
        "text",
        "link",
        "file",
        "image",
        "video",
        "audio",
        "private_area",
      ],
      grok_conv_mode: ["inherit", "off", "suggest", "auto"],
      grok_global_mode: ["off", "suggest", "auto_per_funnel", "auto_all"],
      ia_mode: ["off", "suggest", "auto"],
      lead_status: [
        "new",
        "in_conversation",
        "awaiting_reply",
        "checkout_sent",
        "pix_pending",
        "buyer",
        "subscriber_active",
        "subscription_expired",
        "in_funnel",
        "in_story",
        "ready_upsell",
        "inactive",
        "blocked",
      ],
      lead_temperature: ["cold", "warm", "hot"],
      learning_status: ["pending", "approved", "rejected"],
      memory_kind: ["commercial", "emotional"],
      message_kind: [
        "text",
        "audio",
        "file",
        "image",
        "video",
        "link",
        "checkout",
        "offer",
        "system",
      ],
      message_sender: ["lead", "admin", "bot", "automation", "grok"],
      objection_status: ["open", "handled", "dismissed"],
      objection_type: [
        "preco",
        "desconfianca",
        "vou_pensar",
        "nao_entendi",
        "sem_pix_agora",
        "pedido_desconto",
        "nao_sei_se_e_pra_mim",
        "comparando",
        "problema_pagamento",
        "quer_humano",
        "garantia",
        "momento_ruim",
        "medo_nao_receber",
        "outra",
      ],
      payment_status: [
        "pending",
        "checkout_sent",
        "approved",
        "cancelled",
        "expired",
        "failed",
        "refunded",
      ],
      quick_reply_category: [
        "boas_vindas",
        "como_funciona",
        "preco",
        "pagamento",
        "checkout_cakto",
        "acesso_grupo",
        "entrega_conteudo",
        "suporte",
        "pix_pendente",
        "pos_compra",
        "renovacao",
        "upsell",
        "objecao",
        "outro",
      ],
      story_category: [
        "curiosidade",
        "proximidade",
        "bastidores",
        "transformacao",
        "confianca",
        "urgencia_natural",
        "reativacao",
        "upsell",
        "educacao",
        "relacionamento",
      ],
    },
  },
} as const
