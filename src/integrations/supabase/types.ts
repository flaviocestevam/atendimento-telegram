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
          cakto_subscription_id: string | null
          cancel_requested_at: string | null
          content_id: string | null
          created_at: string
          delivery_payload: string | null
          expires_at: string | null
          id: string
          invite_link: string | null
          lead_id: string | null
          next_charge_at: string | null
          order_id: string | null
          plan_id: string | null
          renewal_count: number
          revoked_at: string | null
          seller_profile_id: string
          starts_at: string
          status: string
          telegram_group_id: string | null
          telegram_user_id: string | null
        }
        Insert: {
          access_type: string
          cakto_subscription_id?: string | null
          cancel_requested_at?: string | null
          content_id?: string | null
          created_at?: string
          delivery_payload?: string | null
          expires_at?: string | null
          id?: string
          invite_link?: string | null
          lead_id?: string | null
          next_charge_at?: string | null
          order_id?: string | null
          plan_id?: string | null
          renewal_count?: number
          revoked_at?: string | null
          seller_profile_id: string
          starts_at?: string
          status?: string
          telegram_group_id?: string | null
          telegram_user_id?: string | null
        }
        Update: {
          access_type?: string
          cakto_subscription_id?: string | null
          cancel_requested_at?: string | null
          content_id?: string | null
          created_at?: string
          delivery_payload?: string | null
          expires_at?: string | null
          id?: string
          invite_link?: string | null
          lead_id?: string | null
          next_charge_at?: string | null
          order_id?: string | null
          plan_id?: string | null
          renewal_count?: number
          revoked_at?: string | null
          seller_profile_id?: string
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
            foreignKeyName: "access_grants_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
            foreignKeyName: "access_grants_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
          seller_profile_id: string | null
          telegram_user_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          seller_profile_id?: string | null
          telegram_user_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          seller_profile_id?: string | null
          telegram_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
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
          approved_at: string | null
          approved_by_admin: boolean | null
          confidence: number | null
          content: string
          created_at: string
          description: string | null
          evidence: Json
          id: string
          kind: string
          learning_type: string | null
          seller_profile_id: string | null
          status: Database["public"]["Enums"]["learning_status"]
          suggested_action: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_admin?: boolean | null
          confidence?: number | null
          content: string
          created_at?: string
          description?: string | null
          evidence?: Json
          id?: string
          kind: string
          learning_type?: string | null
          seller_profile_id?: string | null
          status?: Database["public"]["Enums"]["learning_status"]
          suggested_action?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_admin?: boolean | null
          confidence?: number | null
          content?: string
          created_at?: string
          description?: string | null
          evidence?: Json
          id?: string
          kind?: string
          learning_type?: string | null
          seller_profile_id?: string | null
          status?: Database["public"]["Enums"]["learning_status"]
          suggested_action?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learnings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          cost_estimate_cents: number
          created_at: string
          enable_ai: boolean
          enable_auto_reply: boolean | null
          fallback_message: string | null
          grok_global_mode: Database["public"]["Enums"]["grok_global_mode"]
          id: string
          max_messages_per_user_per_day: number
          messages_today: number
          model: string
          provider: string
          require_approval_for_funnel_changes: boolean | null
          require_approval_for_offers: boolean | null
          seller_profile: Json
          seller_profile_id: string | null
          system_prompt: string | null
          tone: string | null
          updated_at: string
          xai_api_key_set: boolean
        }
        Insert: {
          cost_estimate_cents?: number
          created_at?: string
          enable_ai?: boolean
          enable_auto_reply?: boolean | null
          fallback_message?: string | null
          grok_global_mode?: Database["public"]["Enums"]["grok_global_mode"]
          id?: string
          max_messages_per_user_per_day?: number
          messages_today?: number
          model?: string
          provider?: string
          require_approval_for_funnel_changes?: boolean | null
          require_approval_for_offers?: boolean | null
          seller_profile?: Json
          seller_profile_id?: string | null
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
          xai_api_key_set?: boolean
        }
        Update: {
          cost_estimate_cents?: number
          created_at?: string
          enable_ai?: boolean
          enable_auto_reply?: boolean | null
          fallback_message?: string | null
          grok_global_mode?: Database["public"]["Enums"]["grok_global_mode"]
          id?: string
          max_messages_per_user_per_day?: number
          messages_today?: number
          model?: string
          provider?: string
          require_approval_for_funnel_changes?: boolean | null
          require_approval_for_offers?: boolean | null
          seller_profile?: Json
          seller_profile_id?: string | null
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
          xai_api_key_set?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_type: string | null
          actions: Json
          condition_json: Json | null
          created_at: string
          delay_minutes: number | null
          id: string
          is_active: boolean
          message: string | null
          name: string
          seller_profile_id: string
          timing_unit: string | null
          timing_value: number | null
          trigger: Database["public"]["Enums"]["automation_trigger"] | null
          trigger_event: string | null
          type: string
          updated_at: string
        }
        Insert: {
          action_type?: string | null
          actions?: Json
          condition_json?: Json | null
          created_at?: string
          delay_minutes?: number | null
          id?: string
          is_active?: boolean
          message?: string | null
          name: string
          seller_profile_id: string
          timing_unit?: string | null
          timing_value?: number | null
          trigger?: Database["public"]["Enums"]["automation_trigger"] | null
          trigger_event?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          action_type?: string | null
          actions?: Json
          condition_json?: Json | null
          created_at?: string
          delay_minutes?: number | null
          id?: string
          is_active?: boolean
          message?: string | null
          name?: string
          seller_profile_id?: string
          timing_unit?: string | null
          timing_value?: number | null
          trigger?: Database["public"]["Enums"]["automation_trigger"] | null
          trigger_event?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          seller_profile_id: string | null
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
          seller_profile_id?: string | null
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
          seller_profile_id?: string | null
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
          {
            foreignKeyName: "cakto_events_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cakto_webhook_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string | null
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          provider_order_id: string | null
          provider_payment_id: string | null
          seller_profile_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type?: string | null
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          seller_profile_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          seller_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cakto_webhook_events_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_events: {
        Row: {
          access_grant_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          metadata: Json | null
          offer_shown: string | null
          outcome: string | null
          reason: string | null
          seller_profile_id: string | null
          stage: string
          telegram_user_id: string | null
        }
        Insert: {
          access_grant_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          offer_shown?: string | null
          outcome?: string | null
          reason?: string | null
          seller_profile_id?: string | null
          stage?: string
          telegram_user_id?: string | null
        }
        Update: {
          access_grant_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          offer_shown?: string | null
          outcome?: string | null
          reason?: string | null
          seller_profile_id?: string | null
          stage?: string
          telegram_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_events_access_grant_id_fkey"
            columns: ["access_grant_id"]
            isOneToOne: false
            referencedRelation: "access_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_events_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_events_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_events: {
        Row: {
          conversation_id: string | null
          created_at: string
          event_label: string | null
          event_type: string
          extracted_text: string | null
          id: string
          lead_id: string | null
          message_id: string | null
          metadata: Json | null
          seller_profile_id: string | null
          signal_strength: number
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          event_label?: string | null
          event_type: string
          extracted_text?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          seller_profile_id?: string | null
          signal_strength?: number
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          event_label?: string | null
          event_type?: string
          extracted_text?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          seller_profile_id?: string | null
          signal_strength?: number
        }
        Relationships: [
          {
            foreignKeyName: "commercial_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_events_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_profiles: {
        Row: {
          best_conversion_angle: string | null
          buying_motivation: string | null
          buying_stage: string | null
          created_at: string
          discount_sensitivity: number
          id: string
          last_commercial_summary: string | null
          lead_id: string | null
          preferred_offer_type: string | null
          preferred_price_range: string | null
          primary_persona: string | null
          products_of_interest: Json | null
          recurring_objections: Json | null
          secondary_persona: string | null
          seller_profile_id: string | null
          trust_barrier_level: number
          updated_at: string
          upsell_potential_score: number
          urgency_level: number
        }
        Insert: {
          best_conversion_angle?: string | null
          buying_motivation?: string | null
          buying_stage?: string | null
          created_at?: string
          discount_sensitivity?: number
          id?: string
          last_commercial_summary?: string | null
          lead_id?: string | null
          preferred_offer_type?: string | null
          preferred_price_range?: string | null
          primary_persona?: string | null
          products_of_interest?: Json | null
          recurring_objections?: Json | null
          secondary_persona?: string | null
          seller_profile_id?: string | null
          trust_barrier_level?: number
          updated_at?: string
          upsell_potential_score?: number
          urgency_level?: number
        }
        Update: {
          best_conversion_angle?: string | null
          buying_motivation?: string | null
          buying_stage?: string | null
          created_at?: string
          discount_sensitivity?: number
          id?: string
          last_commercial_summary?: string | null
          lead_id?: string | null
          preferred_offer_type?: string | null
          preferred_price_range?: string | null
          primary_persona?: string | null
          products_of_interest?: Json | null
          recurring_objections?: Json | null
          secondary_persona?: string | null
          seller_profile_id?: string | null
          trust_barrier_level?: number
          updated_at?: string
          upsell_potential_score?: number
          urgency_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "commercial_profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_profiles_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
          seller_profile_id: string | null
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
          seller_profile_id?: string | null
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
          seller_profile_id?: string | null
          tags?: string[]
          updated_at?: string
          upsell_content_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
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
          grok_enabled: boolean | null
          grok_mode: Database["public"]["Enums"]["grok_conv_mode"]
          id: string
          last_interaction_at: string | null
          last_message_at: string | null
          lead_id: string | null
          needs_human: boolean
          score_buy: number
          score_relationship: number
          seller_profile_id: string | null
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
          grok_enabled?: boolean | null
          grok_mode?: Database["public"]["Enums"]["grok_conv_mode"]
          id?: string
          last_interaction_at?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          needs_human?: boolean
          score_buy?: number
          score_relationship?: number
          seller_profile_id?: string | null
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
          grok_enabled?: boolean | null
          grok_mode?: Database["public"]["Enums"]["grok_conv_mode"]
          id?: string
          last_interaction_at?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          needs_human?: boolean
          score_buy?: number
          score_relationship?: number
          seller_profile_id?: string | null
          status?: string
          telegram_user_id?: string | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: false
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_memories: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          follow_up_after: string | null
          id: string
          importance: number
          is_active: boolean
          is_sensitive: boolean
          last_used_at: string | null
          lead_id: string | null
          memory_type: string
          message_id: string | null
          person_name: string | null
          relationship_to_lead: string | null
          seller_profile_id: string | null
          sentiment: string | null
          should_follow_up: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          follow_up_after?: string | null
          id?: string
          importance?: number
          is_active?: boolean
          is_sensitive?: boolean
          last_used_at?: string | null
          lead_id?: string | null
          memory_type: string
          message_id?: string | null
          person_name?: string | null
          relationship_to_lead?: string | null
          seller_profile_id?: string | null
          sentiment?: string | null
          should_follow_up?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          follow_up_after?: string | null
          id?: string
          importance?: number
          is_active?: boolean
          is_sensitive?: boolean
          last_used_at?: string | null
          lead_id?: string | null
          memory_type?: string
          message_id?: string | null
          person_name?: string | null
          relationship_to_lead?: string | null
          seller_profile_id?: string | null
          sentiment?: string | null
          should_follow_up?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_memories_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_memories_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_memories_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_memories_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_profiles: {
        Row: {
          communication_preferences: Json | null
          created_at: string
          emotional_tone: string | null
          id: string
          important_events: Json | null
          important_people: Json | null
          last_care_opportunity: string | null
          last_emotional_summary: string | null
          lead_id: string | null
          personal_context_summary: string | null
          positive_topics: Json | null
          preferred_empathy_style: string | null
          relationship_stage: string
          seller_profile_id: string | null
          sensitive_topics: Json | null
          updated_at: string
        }
        Insert: {
          communication_preferences?: Json | null
          created_at?: string
          emotional_tone?: string | null
          id?: string
          important_events?: Json | null
          important_people?: Json | null
          last_care_opportunity?: string | null
          last_emotional_summary?: string | null
          lead_id?: string | null
          personal_context_summary?: string | null
          positive_topics?: Json | null
          preferred_empathy_style?: string | null
          relationship_stage?: string
          seller_profile_id?: string | null
          sensitive_topics?: Json | null
          updated_at?: string
        }
        Update: {
          communication_preferences?: Json | null
          created_at?: string
          emotional_tone?: string | null
          id?: string
          important_events?: Json | null
          important_people?: Json | null
          last_care_opportunity?: string | null
          last_emotional_summary?: string | null
          lead_id?: string | null
          personal_context_summary?: string | null
          positive_topics?: Json | null
          preferred_empathy_style?: string | null
          relationship_stage?: string
          seller_profile_id?: string | null
          sensitive_topics?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_profiles_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
      funnel_memberships: {
        Row: {
          completed_at: string | null
          current_step_id: string | null
          entered_at: string
          exited_at: string | null
          funnel_id: string | null
          id: string
          last_step_sent_at: string | null
          lead_id: string | null
          seller_profile_id: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          current_step_id?: string | null
          entered_at?: string
          exited_at?: string | null
          funnel_id?: string | null
          id?: string
          last_step_sent_at?: string | null
          lead_id?: string | null
          seller_profile_id?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          current_step_id?: string | null
          entered_at?: string
          exited_at?: string | null
          funnel_id?: string | null
          id?: string
          last_step_sent_at?: string | null
          lead_id?: string | null
          seller_profile_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_memberships_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_memberships_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_memberships_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_memberships_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_steps: {
        Row: {
          action_type: string | null
          content_id: string | null
          created_at: string
          delay_minutes: number
          funnel_id: string | null
          id: string
          is_active: boolean
          message_template: string | null
          name: string | null
          offer_type: string | null
          plan_id: string | null
          requires_human_approval: boolean
          seller_profile_id: string | null
          step_order: number
          updated_at: string
        }
        Insert: {
          action_type?: string | null
          content_id?: string | null
          created_at?: string
          delay_minutes?: number
          funnel_id?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          name?: string | null
          offer_type?: string | null
          plan_id?: string | null
          requires_human_approval?: boolean
          seller_profile_id?: string | null
          step_order: number
          updated_at?: string
        }
        Update: {
          action_type?: string | null
          content_id?: string | null
          created_at?: string
          delay_minutes?: number
          funnel_id?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          name?: string | null
          offer_type?: string | null
          plan_id?: string | null
          requires_human_approval?: boolean
          seller_profile_id?: string | null
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_steps_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string
          description: string | null
          goal: string | null
          grok_mode: string | null
          ia_can_create_checkout: boolean
          ia_mode: Database["public"]["Enums"]["ia_mode"]
          ia_requires_approval: boolean
          id: string
          metrics: Json
          name: string
          seller_profile_id: string | null
          status: string
          steps: Json
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal?: string | null
          grok_mode?: string | null
          ia_can_create_checkout?: boolean
          ia_mode?: Database["public"]["Enums"]["ia_mode"]
          ia_requires_approval?: boolean
          id?: string
          metrics?: Json
          name: string
          seller_profile_id?: string | null
          status?: string
          steps?: Json
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goal?: string | null
          grok_mode?: string | null
          ia_can_create_checkout?: boolean
          ia_mode?: Database["public"]["Enums"]["ia_mode"]
          ia_requires_approval?: boolean
          id?: string
          metrics?: Json
          name?: string
          seller_profile_id?: string | null
          status?: string
          steps?: Json
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
          seller_profile_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          seller_profile_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          seller_profile_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          importance: number
          is_active: boolean
          lead_id: string | null
          memory_type: string
          seller_profile_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          importance?: number
          is_active?: boolean
          lead_id?: string | null
          memory_type?: string
          seller_profile_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          importance?: number
          is_active?: boolean
          lead_id?: string | null
          memory_type?: string
          seller_profile_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_memories_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_memories_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          buyer_tier: string | null
          checkout_abandon_count: number
          commercial_opportunity_score: number
          created_at: string
          current_funnel_id: string | null
          current_interest: string | null
          current_offer_id: string | null
          current_story_funnel_id: string | null
          display_name: string | null
          emotional_connection_score: number
          id: string
          is_blocked: boolean
          language_confidence: number | null
          language_confirmed_at: string | null
          language_detection_source: string | null
          last_interaction_at: string | null
          last_purchase_at: string | null
          lead_stage: string
          next_best_action: string | null
          notes: string | null
          parasocial_strength: number
          preferred_language: string
          purchase_intent_score: number
          relationship_score: number
          seller_profile_id: string | null
          source: string
          source_detail: string | null
          status: string
          tags: Json
          telegram_user_id: string | null
          temperature: string
          total_orders: number
          total_paid_orders: number
          total_spent_cents: number
          trust_score: number
          updated_at: string
          username: string | null
        }
        Insert: {
          buyer_tier?: string | null
          checkout_abandon_count?: number
          commercial_opportunity_score?: number
          created_at?: string
          current_funnel_id?: string | null
          current_interest?: string | null
          current_offer_id?: string | null
          current_story_funnel_id?: string | null
          display_name?: string | null
          emotional_connection_score?: number
          id?: string
          is_blocked?: boolean
          language_confidence?: number | null
          language_confirmed_at?: string | null
          language_detection_source?: string | null
          last_interaction_at?: string | null
          last_purchase_at?: string | null
          lead_stage?: string
          next_best_action?: string | null
          notes?: string | null
          parasocial_strength?: number
          preferred_language?: string
          purchase_intent_score?: number
          relationship_score?: number
          seller_profile_id?: string | null
          source?: string
          source_detail?: string | null
          status?: string
          tags?: Json
          telegram_user_id?: string | null
          temperature?: string
          total_orders?: number
          total_paid_orders?: number
          total_spent_cents?: number
          trust_score?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          buyer_tier?: string | null
          checkout_abandon_count?: number
          commercial_opportunity_score?: number
          created_at?: string
          current_funnel_id?: string | null
          current_interest?: string | null
          current_offer_id?: string | null
          current_story_funnel_id?: string | null
          display_name?: string | null
          emotional_connection_score?: number
          id?: string
          is_blocked?: boolean
          language_confidence?: number | null
          language_confirmed_at?: string | null
          language_detection_source?: string | null
          last_interaction_at?: string | null
          last_purchase_at?: string | null
          lead_stage?: string
          next_best_action?: string | null
          notes?: string | null
          parasocial_strength?: number
          preferred_language?: string
          purchase_intent_score?: number
          relationship_score?: number
          seller_profile_id?: string | null
          source?: string
          source_detail?: string | null
          status?: string
          tags?: Json
          telegram_user_id?: string | null
          temperature?: string
          total_orders?: number
          total_paid_orders?: number
          total_spent_cents?: number
          trust_score?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_telegram_user_id_fkey"
            columns: ["telegram_user_id"]
            isOneToOne: true
            referencedRelation: "telegram_users"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["memory_kind"]
          lead_id: string
          seller_profile_id: string | null
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
          seller_profile_id?: string | null
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
          seller_profile_id?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
          lead_id: string | null
          payload: Json
          raw_payload: Json | null
          seller_profile_id: string | null
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
          lead_id?: string | null
          payload?: Json
          raw_payload?: Json | null
          seller_profile_id?: string | null
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
          lead_id?: string | null
          payload?: Json
          raw_payload?: Json | null
          seller_profile_id?: string | null
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
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
      objection_detections: {
        Row: {
          confidence: number | null
          conversation_id: string | null
          created_at: string
          detected_text: string | null
          id: string
          lead_id: string | null
          message_id: string | null
          objection_type_id: string | null
          recommended_action: string | null
          resolved_at: string | null
          seller_profile_id: string | null
          status: string
          suggested_response: string | null
        }
        Insert: {
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          detected_text?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          objection_type_id?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          seller_profile_id?: string | null
          status?: string
          suggested_response?: string | null
        }
        Update: {
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          detected_text?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          objection_type_id?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          seller_profile_id?: string | null
          status?: string
          suggested_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objection_detections_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objection_detections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objection_detections_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objection_detections_objection_type_id_fkey"
            columns: ["objection_type_id"]
            isOneToOne: false
            referencedRelation: "objection_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objection_detections_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objection_types: {
        Row: {
          created_at: string
          default_strategy: string | null
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          seller_profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_strategy?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          seller_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_strategy?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          seller_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objection_types_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
          seller_profile_id: string | null
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
          seller_profile_id?: string | null
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
          seller_profile_id?: string | null
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
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objections_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          cakto_order_id: string | null
          checkout_url: string | null
          content_id: string | null
          created_at: string
          external_reference: string | null
          id: string
          item_type: string
          lead_id: string | null
          metadata: Json | null
          paid_at: string | null
          plan_id: string | null
          provider: string | null
          provider_order_id: string | null
          seller_profile_id: string
          status: string
          telegram_user_id: string | null
        }
        Insert: {
          amount_cents: number
          cakto_order_id?: string | null
          checkout_url?: string | null
          content_id?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          item_type: string
          lead_id?: string | null
          metadata?: Json | null
          paid_at?: string | null
          plan_id?: string | null
          provider?: string | null
          provider_order_id?: string | null
          seller_profile_id: string
          status?: string
          telegram_user_id?: string | null
        }
        Update: {
          amount_cents?: number
          cakto_order_id?: string | null
          checkout_url?: string | null
          content_id?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          item_type?: string
          lead_id?: string | null
          metadata?: Json | null
          paid_at?: string | null
          plan_id?: string | null
          provider?: string | null
          provider_order_id?: string | null
          seller_profile_id?: string
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
            foreignKeyName: "orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
            foreignKeyName: "orders_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
          approved_at_legacy: string | null
          cakto_order_id: string | null
          cakto_payment_id: string | null
          cakto_subscription_id: string | null
          checkout_url: string | null
          created_at: string
          event_payload: Json | null
          id: string
          is_renewal: boolean
          lead_id: string | null
          method: string
          order_id: string | null
          pix_expires_at: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          raw_payload: Json | null
          seller_profile_id: string
          status: string
        }
        Insert: {
          amount_cents: number
          approved_at?: string | null
          approved_at_legacy?: string | null
          cakto_order_id?: string | null
          cakto_payment_id?: string | null
          cakto_subscription_id?: string | null
          checkout_url?: string | null
          created_at?: string
          event_payload?: Json | null
          id?: string
          is_renewal?: boolean
          lead_id?: string | null
          method?: string
          order_id?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          raw_payload?: Json | null
          seller_profile_id: string
          status?: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          approved_at_legacy?: string | null
          cakto_order_id?: string | null
          cakto_payment_id?: string | null
          cakto_subscription_id?: string | null
          checkout_url?: string | null
          created_at?: string
          event_payload?: Json | null
          id?: string
          is_renewal?: boolean
          lead_id?: string | null
          method?: string
          order_id?: string | null
          pix_expires_at?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          raw_payload?: Json | null
          seller_profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          access_type: string
          billing_type: string
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
          seller_profile_id: string | null
          telegram_group_id: string | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          access_type: string
          billing_type?: string
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
          seller_profile_id?: string | null
          telegram_group_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          access_type?: string
          billing_type?: string
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
          seller_profile_id?: string | null
          telegram_group_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
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
          conversion_count: number | null
          conversions: number
          created_at: string
          id: string
          reply_type: string | null
          seller_profile_id: string
          title: string
          type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          active?: boolean
          body: string
          category?: Database["public"]["Enums"]["quick_reply_category"]
          conversion_count?: number | null
          conversions?: number
          created_at?: string
          id?: string
          reply_type?: string | null
          seller_profile_id: string
          title: string
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          active?: boolean
          body?: string
          category?: Database["public"]["Enums"]["quick_reply_category"]
          conversion_count?: number | null
          conversions?: number
          created_at?: string
          id?: string
          reply_type?: string | null
          seller_profile_id?: string
          title?: string
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      response_performance: {
        Row: {
          conversation_id: string | null
          created_at: string
          generated_checkout: boolean
          id: string
          lead_id: string | null
          led_to_purchase: boolean
          led_to_reply: boolean
          message_id: string | null
          related_funnel_id: string | null
          related_objection_id: string | null
          related_story_funnel_id: string | null
          response_text: string | null
          response_type: string | null
          revenue_cents: number
          seller_profile_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          generated_checkout?: boolean
          id?: string
          lead_id?: string | null
          led_to_purchase?: boolean
          led_to_reply?: boolean
          message_id?: string | null
          related_funnel_id?: string | null
          related_objection_id?: string | null
          related_story_funnel_id?: string | null
          response_text?: string | null
          response_type?: string | null
          revenue_cents?: number
          seller_profile_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          generated_checkout?: boolean
          id?: string
          lead_id?: string | null
          led_to_purchase?: boolean
          led_to_reply?: boolean
          message_id?: string | null
          related_funnel_id?: string | null
          related_objection_id?: string | null
          related_story_funnel_id?: string | null
          response_text?: string | null
          response_type?: string | null
          revenue_cents?: number
          seller_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "response_performance_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_performance_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_performance_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_performance_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          created_at: string
          error: string | null
          id: string
          message: string
          result: Json | null
          scheduled_at: string
          seller_profile_id: string
          sent_at: string | null
          status: string
          telegram_group_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          message: string
          result?: Json | null
          scheduled_at: string
          seller_profile_id: string
          sent_at?: string | null
          status?: string
          telegram_group_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          message?: string
          result?: Json | null
          scheduled_at?: string
          seller_profile_id?: string
          sent_at?: string | null
          status?: string
          telegram_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_telegram_group_id_fkey"
            columns: ["telegram_group_id"]
            isOneToOne: false
            referencedRelation: "telegram_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_bots: {
        Row: {
          bot_name: string | null
          bot_username: string | null
          created_at: string
          id: string
          last_error: string | null
          last_webhook_update_at: string | null
          seller_profile_id: string
          status: string
          telegram_bot_id: string | null
          telegram_bot_token: string | null
          updated_at: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          bot_name?: string | null
          bot_username?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_webhook_update_at?: string | null
          seller_profile_id: string
          status?: string
          telegram_bot_id?: string | null
          telegram_bot_token?: string | null
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          bot_name?: string | null
          bot_username?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_webhook_update_at?: string | null
          seller_profile_id?: string
          status?: string
          telegram_bot_id?: string | null
          telegram_bot_token?: string | null
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_bots_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_cakto_settings: {
        Row: {
          cakto_api_key: string | null
          cakto_client_id: string | null
          cakto_client_secret: string | null
          cakto_webhook_secret: string | null
          cakto_webhook_url: string | null
          created_at: string
          id: string
          last_error: string | null
          last_webhook_received_at: string | null
          seller_profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cakto_api_key?: string | null
          cakto_client_id?: string | null
          cakto_client_secret?: string | null
          cakto_webhook_secret?: string | null
          cakto_webhook_url?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_webhook_received_at?: string | null
          seller_profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cakto_api_key?: string | null
          cakto_client_id?: string | null
          cakto_client_secret?: string | null
          cakto_webhook_secret?: string | null
          cakto_webhook_url?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_webhook_received_at?: string | null
          seller_profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_cakto_settings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_grok_settings: {
        Row: {
          created_at: string
          enable_ai: boolean
          enable_auto_reply: boolean
          fallback_message: string | null
          global_mode: string
          id: string
          last_error: string | null
          max_messages_per_user_per_day: number
          model: string
          provider: string
          require_approval_for_funnel_changes: boolean
          require_approval_for_offers: boolean
          seller_profile_id: string
          status: string
          system_prompt: string | null
          updated_at: string
          xai_api_key: string | null
        }
        Insert: {
          created_at?: string
          enable_ai?: boolean
          enable_auto_reply?: boolean
          fallback_message?: string | null
          global_mode?: string
          id?: string
          last_error?: string | null
          max_messages_per_user_per_day?: number
          model?: string
          provider?: string
          require_approval_for_funnel_changes?: boolean
          require_approval_for_offers?: boolean
          seller_profile_id: string
          status?: string
          system_prompt?: string | null
          updated_at?: string
          xai_api_key?: string | null
        }
        Update: {
          created_at?: string
          enable_ai?: boolean
          enable_auto_reply?: boolean
          fallback_message?: string | null
          global_mode?: string
          id?: string
          last_error?: string | null
          max_messages_per_user_per_day?: number
          model?: string
          provider?: string
          require_approval_for_funnel_changes?: boolean
          require_approval_for_offers?: boolean
          seller_profile_id?: string
          status?: string
          system_prompt?: string | null
          updated_at?: string
          xai_api_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_grok_settings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_platform_settings: {
        Row: {
          created_at: string
          currency: string
          default_language: string
          development_mode: boolean
          id: string
          login_enabled: boolean
          seller_profile_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          default_language?: string
          development_mode?: boolean
          id?: string
          login_enabled?: boolean
          seller_profile_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          default_language?: string
          development_mode?: boolean
          id?: string
          login_enabled?: boolean
          seller_profile_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_platform_settings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profile: {
        Row: {
          allow_typos: boolean
          avatar_url: string | null
          away_message: string | null
          bio: string | null
          commercial_rules: string | null
          commercial_rules_updated_at: string | null
          commercial_rules_updated_by: string | null
          created_at: string
          display_name: string
          emotional_rules: string | null
          emotional_rules_updated_at: string | null
          emotional_rules_updated_by: string | null
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
          commercial_rules_updated_at?: string | null
          commercial_rules_updated_by?: string | null
          created_at?: string
          display_name?: string
          emotional_rules?: string | null
          emotional_rules_updated_at?: string | null
          emotional_rules_updated_by?: string | null
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
          commercial_rules_updated_at?: string | null
          commercial_rules_updated_by?: string | null
          created_at?: string
          display_name?: string
          emotional_rules?: string | null
          emotional_rules_updated_at?: string | null
          emotional_rules_updated_by?: string | null
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
      seller_profiles: {
        Row: {
          allow_small_typos: boolean
          avatar_url: string | null
          away_message: string | null
          commercial_rules: string | null
          communication_style: string | null
          created_at: string
          currency: string
          default_language: string
          display_name: string
          emotional_rules: string | null
          forbidden_promises: string | null
          id: string
          informality_level: number
          is_active: boolean
          owner_user_id: string | null
          public_description: string | null
          return_message: string | null
          short_bio: string | null
          status: string
          timezone: string
          tone_of_voice: string | null
          typo_frequency: number
          updated_at: string
          use_message_splitting: boolean
          use_short_messages: boolean
          use_slang: boolean
          use_typing_delays: boolean
          username: string | null
          working_hours: Json | null
          working_hours_enabled: boolean
        }
        Insert: {
          allow_small_typos?: boolean
          avatar_url?: string | null
          away_message?: string | null
          commercial_rules?: string | null
          communication_style?: string | null
          created_at?: string
          currency?: string
          default_language?: string
          display_name: string
          emotional_rules?: string | null
          forbidden_promises?: string | null
          id?: string
          informality_level?: number
          is_active?: boolean
          owner_user_id?: string | null
          public_description?: string | null
          return_message?: string | null
          short_bio?: string | null
          status?: string
          timezone?: string
          tone_of_voice?: string | null
          typo_frequency?: number
          updated_at?: string
          use_message_splitting?: boolean
          use_short_messages?: boolean
          use_slang?: boolean
          use_typing_delays?: boolean
          username?: string | null
          working_hours?: Json | null
          working_hours_enabled?: boolean
        }
        Update: {
          allow_small_typos?: boolean
          avatar_url?: string | null
          away_message?: string | null
          commercial_rules?: string | null
          communication_style?: string | null
          created_at?: string
          currency?: string
          default_language?: string
          display_name?: string
          emotional_rules?: string | null
          forbidden_promises?: string | null
          id?: string
          informality_level?: number
          is_active?: boolean
          owner_user_id?: string | null
          public_description?: string | null
          return_message?: string | null
          short_bio?: string | null
          status?: string
          timezone?: string
          tone_of_voice?: string | null
          typo_frequency?: number
          updated_at?: string
          use_message_splitting?: boolean
          use_short_messages?: boolean
          use_slang?: boolean
          use_typing_delays?: boolean
          username?: string | null
          working_hours?: Json | null
          working_hours_enabled?: boolean
        }
        Relationships: []
      }
      seller_voice_settings: {
        Row: {
          created_at: string
          elevenlabs_api_key: string | null
          enabled: boolean
          id: string
          last_error: string | null
          max_audio_characters: number
          max_audio_messages_per_user_per_day: number
          model: string | null
          provider: string
          seller_profile_id: string
          send_audio_mode: string
          send_text_with_audio: boolean
          status: string
          updated_at: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          elevenlabs_api_key?: string | null
          enabled?: boolean
          id?: string
          last_error?: string | null
          max_audio_characters?: number
          max_audio_messages_per_user_per_day?: number
          model?: string | null
          provider?: string
          seller_profile_id: string
          send_audio_mode?: string
          send_text_with_audio?: boolean
          status?: string
          updated_at?: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          elevenlabs_api_key?: string | null
          enabled?: boolean
          id?: string
          last_error?: string | null
          max_audio_characters?: number
          max_audio_messages_per_user_per_day?: number
          model?: string | null
          provider?: string
          seller_profile_id?: string
          send_audio_mode?: string
          send_text_with_audio?: boolean
          status?: string
          updated_at?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_voice_settings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          seller_profile_id: string | null
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
          seller_profile_id?: string | null
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
          seller_profile_id?: string | null
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
            foreignKeyName: "stories_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
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
      story_funnel_memberships: {
        Row: {
          completed_at: string | null
          current_story_step_id: string | null
          entered_at: string
          exited_at: string | null
          id: string
          last_step_sent_at: string | null
          lead_id: string | null
          seller_profile_id: string | null
          status: string
          story_funnel_id: string | null
        }
        Insert: {
          completed_at?: string | null
          current_story_step_id?: string | null
          entered_at?: string
          exited_at?: string | null
          id?: string
          last_step_sent_at?: string | null
          lead_id?: string | null
          seller_profile_id?: string | null
          status?: string
          story_funnel_id?: string | null
        }
        Update: {
          completed_at?: string | null
          current_story_step_id?: string | null
          entered_at?: string
          exited_at?: string | null
          id?: string
          last_step_sent_at?: string | null
          lead_id?: string | null
          seller_profile_id?: string | null
          status?: string
          story_funnel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_funnel_memberships_current_story_step_id_fkey"
            columns: ["current_story_step_id"]
            isOneToOne: false
            referencedRelation: "story_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_funnel_memberships_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_funnel_memberships_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_funnel_memberships_story_funnel_id_fkey"
            columns: ["story_funnel_id"]
            isOneToOne: false
            referencedRelation: "story_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      story_funnel_metrics: {
        Row: {
          ai_suggestion: string | null
          best_step_id: string | null
          checkout_generated: number
          conversion_rate: number
          id: string
          leads_entered: number
          leads_replied: number
          main_objection: string | null
          purchases: number
          reached_offer: number
          revenue_cents: number
          seller_profile_id: string | null
          story_funnel_id: string | null
          updated_at: string
          worst_step_id: string | null
        }
        Insert: {
          ai_suggestion?: string | null
          best_step_id?: string | null
          checkout_generated?: number
          conversion_rate?: number
          id?: string
          leads_entered?: number
          leads_replied?: number
          main_objection?: string | null
          purchases?: number
          reached_offer?: number
          revenue_cents?: number
          seller_profile_id?: string | null
          story_funnel_id?: string | null
          updated_at?: string
          worst_step_id?: string | null
        }
        Update: {
          ai_suggestion?: string | null
          best_step_id?: string | null
          checkout_generated?: number
          conversion_rate?: number
          id?: string
          leads_entered?: number
          leads_replied?: number
          main_objection?: string | null
          purchases?: number
          reached_offer?: number
          revenue_cents?: number
          seller_profile_id?: string | null
          story_funnel_id?: string | null
          updated_at?: string
          worst_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_funnel_metrics_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_funnel_metrics_story_funnel_id_fkey"
            columns: ["story_funnel_id"]
            isOneToOne: false
            referencedRelation: "story_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      story_funnels: {
        Row: {
          commercial_goal: string | null
          content_id: string | null
          created_at: string
          description: string | null
          emotional_angle: string | null
          grok_mode: string
          id: string
          is_active: boolean
          main_story_angle: string | null
          name: string
          plan_id: string | null
          primary_offer_type: string | null
          seller_profile_id: string | null
          story_category: string
          updated_at: string
          upsell_content_id: string | null
          upsell_plan_id: string | null
        }
        Insert: {
          commercial_goal?: string | null
          content_id?: string | null
          created_at?: string
          description?: string | null
          emotional_angle?: string | null
          grok_mode?: string
          id?: string
          is_active?: boolean
          main_story_angle?: string | null
          name: string
          plan_id?: string | null
          primary_offer_type?: string | null
          seller_profile_id?: string | null
          story_category: string
          updated_at?: string
          upsell_content_id?: string | null
          upsell_plan_id?: string | null
        }
        Update: {
          commercial_goal?: string | null
          content_id?: string | null
          created_at?: string
          description?: string | null
          emotional_angle?: string | null
          grok_mode?: string
          id?: string
          is_active?: boolean
          main_story_angle?: string | null
          name?: string
          plan_id?: string | null
          primary_offer_type?: string | null
          seller_profile_id?: string | null
          story_category?: string
          updated_at?: string
          upsell_content_id?: string | null
          upsell_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_funnels_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_funnels_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_funnels_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_funnels_upsell_content_id_fkey"
            columns: ["upsell_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_funnels_upsell_plan_id_fkey"
            columns: ["upsell_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
      story_steps: {
        Row: {
          content_id: string | null
          created_at: string
          delay_minutes: number
          expected_lead_reaction: string | null
          id: string
          is_active: boolean
          message_template: string | null
          offer_moment: boolean
          offer_type: string | null
          plan_id: string | null
          requires_human_approval: boolean
          requires_response: boolean
          seller_profile_id: string | null
          step_name: string | null
          step_order: number
          step_purpose: string | null
          story_funnel_id: string | null
          success_metric: string | null
          updated_at: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          delay_minutes?: number
          expected_lead_reaction?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          offer_moment?: boolean
          offer_type?: string | null
          plan_id?: string | null
          requires_human_approval?: boolean
          requires_response?: boolean
          seller_profile_id?: string | null
          step_name?: string | null
          step_order: number
          step_purpose?: string | null
          story_funnel_id?: string | null
          success_metric?: string | null
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          delay_minutes?: number
          expected_lead_reaction?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          offer_moment?: boolean
          offer_type?: string | null
          plan_id?: string | null
          requires_human_approval?: boolean
          requires_response?: boolean
          seller_profile_id?: string | null
          step_name?: string | null
          step_order?: number
          step_purpose?: string | null
          story_funnel_id?: string | null
          success_metric?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_steps_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_steps_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_steps_story_funnel_id_fkey"
            columns: ["story_funnel_id"]
            isOneToOne: false
            referencedRelation: "story_funnels"
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
          seller_profile_id: string | null
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
          seller_profile_id?: string | null
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
          seller_profile_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_groups_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          buyer_tier: string | null
          created_at: string
          first_name: string | null
          id: string
          is_blocked: boolean
          language_code: string | null
          last_name: string | null
          last_purchase_at: string | null
          origin: string | null
          parasocial_strength: number
          score_buy: number
          score_relationship: number
          seller_profile_id: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[]
          telegram_id: string
          temperature: Database["public"]["Enums"]["lead_temperature"]
          total_spent: number
          updated_at: string
          username: string | null
        }
        Insert: {
          buyer_tier?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_blocked?: boolean
          language_code?: string | null
          last_name?: string | null
          last_purchase_at?: string | null
          origin?: string | null
          parasocial_strength?: number
          score_buy?: number
          score_relationship?: number
          seller_profile_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          telegram_id: string
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          total_spent?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          buyer_tier?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_blocked?: boolean
          language_code?: string | null
          last_name?: string | null
          last_purchase_at?: string | null
          origin?: string | null
          parasocial_strength?: number
          score_buy?: number
          score_relationship?: number
          seller_profile_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          telegram_id?: string
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          total_spent?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_users_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      voice_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          max_audio_characters: number
          max_audio_messages_per_user_per_day: number
          model: string | null
          provider: string
          seller_profile_id: string | null
          send_audio_mode: string
          send_text_with_audio: boolean
          updated_at: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          max_audio_characters?: number
          max_audio_messages_per_user_per_day?: number
          model?: string | null
          provider?: string
          seller_profile_id?: string | null
          send_audio_mode?: string
          send_text_with_audio?: boolean
          updated_at?: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          max_audio_characters?: number
          max_audio_messages_per_user_per_day?: number
          model?: string | null
          provider?: string
          seller_profile_id?: string | null
          send_audio_mode?: string
          send_text_with_audio?: boolean
          updated_at?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_settings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calc_buyer_tier: { Args: { total_brl: number }; Returns: string }
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
