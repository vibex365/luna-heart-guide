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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_action_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      appreciation_entries: {
        Row: {
          appreciation_text: string
          created_at: string
          id: string
          is_visible_to_partner: boolean
          partner_link_id: string
          prompt_text: string
          user_id: string
        }
        Insert: {
          appreciation_text: string
          created_at?: string
          id?: string
          is_visible_to_partner?: boolean
          partner_link_id: string
          prompt_text: string
          user_id: string
        }
        Update: {
          appreciation_text?: string
          created_at?: string
          id?: string
          is_visible_to_partner?: boolean
          partner_link_id?: string
          prompt_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appreciation_entries_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          ai_model_used: string | null
          category: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          ai_model_used?: string | null
          category?: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          ai_model_used?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      blog_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      blog_topics: {
        Row: {
          category: string
          created_at: string
          id: string
          keywords: string[] | null
          priority: number | null
          status: string
          topic: string
          used_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          priority?: number | null
          status?: string
          topic: string
          used_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          keywords?: string[] | null
          priority?: number | null
          status?: string
          topic?: string
          used_at?: string | null
        }
        Relationships: []
      }
      breathing_exercises: {
        Row: {
          category: string | null
          created_at: string | null
          cycles: number
          description: string | null
          difficulty: string | null
          duration_seconds: number
          exhale_seconds: number
          hold_seconds: number
          id: string
          inhale_seconds: number
          is_active: boolean | null
          is_premium: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          cycles?: number
          description?: string | null
          difficulty?: string | null
          duration_seconds?: number
          exhale_seconds?: number
          hold_seconds?: number
          id?: string
          inhale_seconds?: number
          is_active?: boolean | null
          is_premium?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          cycles?: number
          description?: string | null
          difficulty?: string | null
          duration_seconds?: number
          exhale_seconds?: number
          hold_seconds?: number
          id?: string
          inhale_seconds?: number
          is_active?: boolean | null
          is_premium?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      completed_activities: {
        Row: {
          activity_id: string
          completed_at: string | null
          completed_by: string
          id: string
          notes: string | null
          partner_link_id: string
          partner_rating: number | null
        }
        Insert: {
          activity_id: string
          completed_at?: string | null
          completed_by: string
          id?: string
          notes?: string | null
          partner_link_id: string
          partner_rating?: number | null
        }
        Update: {
          activity_id?: string
          completed_at?: string | null
          completed_by?: string
          id?: string
          notes?: string | null
          partner_link_id?: string
          partner_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "completed_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "shared_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_activities_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_challenges: {
        Row: {
          challenge_id: string
          completed_at: string
          completed_by: string
          id: string
          notes: string | null
          partner_link_id: string
          rating: number | null
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          completed_by: string
          id?: string
          notes?: string | null
          partner_link_id: string
          rating?: number | null
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          completed_by?: string
          id?: string
          notes?: string | null
          partner_link_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "completed_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "couples_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_challenges_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_resolution_templates: {
        Row: {
          category: string
          created_at: string | null
          follow_up_questions: string[] | null
          id: string
          is_active: boolean | null
          script_template: string
          sort_order: number | null
          title: string
          trigger_phrases: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          follow_up_questions?: string[] | null
          id?: string
          is_active?: boolean | null
          script_template: string
          sort_order?: number | null
          title: string
          trigger_phrases?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          follow_up_questions?: string[] | null
          id?: string
          is_active?: boolean | null
          script_template?: string
          sort_order?: number | null
          title?: string
          trigger_phrases?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_analytics: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          module_activated: string
          trigger_detected: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          module_activated: string
          trigger_detected?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          module_activated?: string
          trigger_detected?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      couple_goals: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          partner_link_id: string
          progress: number | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          partner_link_id: string
          progress?: number | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          partner_link_id?: string
          progress?: number | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_goals_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      couples_challenges: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      couples_game_history: {
        Row: {
          completed_at: string
          details: Json | null
          game_type: string
          id: string
          matches: number | null
          partner_link_id: string
          partner_played: boolean | null
          played_by: string
          score: number | null
          total_questions: number | null
        }
        Insert: {
          completed_at?: string
          details?: Json | null
          game_type: string
          id?: string
          matches?: number | null
          partner_link_id: string
          partner_played?: boolean | null
          played_by: string
          score?: number | null
          total_questions?: number | null
        }
        Update: {
          completed_at?: string
          details?: Json | null
          game_type?: string
          id?: string
          matches?: number | null
          partner_link_id?: string
          partner_played?: boolean | null
          played_by?: string
          score?: number | null
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "couples_game_history_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      couples_game_questions: {
        Row: {
          category: string | null
          created_at: string | null
          depth: number | null
          difficulty: string | null
          game_type: string
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          option_a: string | null
          option_b: string | null
          question_text: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          depth?: number | null
          difficulty?: string | null
          game_type: string
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          option_a?: string | null
          option_b?: string | null
          question_text: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          depth?: number | null
          difficulty?: string | null
          game_type?: string
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          option_a?: string | null
          option_b?: string | null
          question_text?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      couples_game_sessions: {
        Row: {
          created_at: string
          current_card_index: number
          game_state: Json
          game_type: string
          id: string
          partner_link_id: string
          started_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_card_index?: number
          game_state?: Json
          game_type: string
          id?: string
          partner_link_id: string
          started_by: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_card_index?: number
          game_state?: Json
          game_type?: string
          id?: string
          partner_link_id?: string
          started_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_game_sessions_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      couples_journal_entries: {
        Row: {
          content: string
          created_at: string | null
          entry_date: string
          id: string
          is_shared: boolean | null
          partner_link_id: string
          prompt_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          entry_date?: string
          id?: string
          is_shared?: boolean | null
          partner_link_id: string
          prompt_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          entry_date?: string
          id?: string
          is_shared?: boolean | null
          partner_link_id?: string
          prompt_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_journal_entries_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_journal_entries_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "couples_journal_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      couples_journal_prompts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          prompt_text: string
          sort_order: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_text: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_text?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      couples_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          media_duration: number | null
          media_url: string | null
          message_type: string
          partner_link_id: string
          reactions: Json | null
          reply_to_id: string | null
          sender_id: string
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_duration?: number | null
          media_url?: string | null
          message_type: string
          partner_link_id: string
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_duration?: number | null
          media_url?: string | null
          message_type?: string
          partner_link_id?: string
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couples_messages_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "couples_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      couples_streaks: {
        Row: {
          badges_earned: string[]
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          partner_link_id: string
          total_activities_completed: number
          updated_at: string
        }
        Insert: {
          badges_earned?: string[]
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          partner_link_id: string
          total_activities_completed?: number
          updated_at?: string
        }
        Update: {
          badges_earned?: string[]
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          partner_link_id?: string
          total_activities_completed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_streaks_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: true
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      couples_trials: {
        Row: {
          converted_at: string | null
          created_at: string | null
          ends_at: string
          features_used: Json | null
          id: string
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          ends_at: string
          features_used?: Json | null
          id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          ends_at?: string
          features_used?: Json | null
          id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      couples_typing_status: {
        Row: {
          id: string
          is_typing: boolean | null
          partner_link_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_typing?: boolean | null
          partner_link_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_typing?: boolean | null
          partner_link_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_typing_status_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_affirmation_templates: {
        Row: {
          account_type: string
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string
          updated_at: string | null
        }
        Insert: {
          account_type?: string
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_question_answers: {
        Row: {
          answer_text: string
          answered_at: string | null
          id: string
          partner_link_id: string
          question_date: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer_text: string
          answered_at?: string | null
          id?: string
          partner_link_id: string
          question_date?: string
          question_id: string
          user_id: string
        }
        Update: {
          answer_text?: string
          answered_at?: string | null
          id?: string
          partner_link_id?: string
          question_date?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_question_answers_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_questions: {
        Row: {
          category: string
          created_at: string | null
          difficulty: string | null
          id: string
          is_active: boolean | null
          question_text: string
          sort_order: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          question_text: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          question_text?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      date_night_ideas: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          is_favorite: boolean
          notes: string | null
          partner_link_id: string
          rating: number | null
          title: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          is_favorite?: boolean
          notes?: string | null
          partner_link_id: string
          rating?: number | null
          title: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          is_favorite?: boolean
          notes?: string | null
          partner_link_id?: string
          rating?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_night_ideas_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_gifts: {
        Row: {
          animation_type: string
          category: string | null
          created_at: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
          sort_order: number | null
          stripe_price_id: string
        }
        Insert: {
          animation_type: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
          sort_order?: number | null
          stripe_price_id: string
        }
        Update: {
          animation_type?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          sort_order?: number | null
          stripe_price_id?: string
        }
        Relationships: []
      }
      dm_segments: {
        Row: {
          created_at: string | null
          cta_text: string
          headline: string
          hero_icon: string | null
          id: string
          is_active: boolean | null
          name: string
          pain_points: Json
          relatability_tagline: string | null
          slug: string
          subheadline: string
          testimonial_ids: Json | null
          testimonials: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cta_text?: string
          headline: string
          hero_icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pain_points?: Json
          relatability_tagline?: string | null
          slug: string
          subheadline: string
          testimonial_ids?: Json | null
          testimonials?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cta_text?: string
          headline?: string
          hero_icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pain_points?: Json
          relatability_tagline?: string | null
          slug?: string
          subheadline?: string
          testimonial_ids?: Json | null
          testimonials?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      flagged_conversations: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          flag_type: string
          id: string
          message_content: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          trigger_phrase: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          flag_type?: string
          id?: string
          message_content?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          trigger_phrase?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          flag_type?: string
          id?: string
          message_content?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          trigger_phrase?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flagged_conversations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          created_at: string
          event_type: string
          funnel_type: string
          id: string
          segment: string | null
          session_id: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          funnel_type: string
          id?: string
          segment?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          funnel_type?: string
          id?: string
          segment?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      intimate_game_sessions: {
        Row: {
          created_at: string
          current_prompt_index: number
          game_type: string
          id: string
          partner_link_id: string
          player_responses: Json
          revealed: boolean
          started_by: string
          updated_at: string
          voice_messages: Json | null
        }
        Insert: {
          created_at?: string
          current_prompt_index?: number
          game_type: string
          id?: string
          partner_link_id: string
          player_responses?: Json
          revealed?: boolean
          started_by: string
          updated_at?: string
          voice_messages?: Json | null
        }
        Update: {
          created_at?: string
          current_prompt_index?: number
          game_type?: string
          id?: string
          partner_link_id?: string
          player_responses?: Json
          revealed?: boolean
          started_by?: string
          updated_at?: string
          voice_messages?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "intimate_game_sessions_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          mood_entry_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mood_entry_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mood_entry_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_mood_entry_id_fkey"
            columns: ["mood_entry_id"]
            isOneToOne: false
            referencedRelation: "mood_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          prompts: Json | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          prompts?: Json | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          prompts?: Json | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          converted_at: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          interaction_count: number | null
          last_interaction_at: string | null
          notes: string | null
          phone: string | null
          segment: string
          source: string
          status: string
          subscriber_id: string
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction_at?: string | null
          notes?: string | null
          phone?: string | null
          segment: string
          source?: string
          status?: string
          subscriber_id: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction_at?: string | null
          notes?: string | null
          phone?: string | null
          segment?: string
          source?: string
          status?: string
          subscriber_id?: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      love_language_results: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          partner_link_id: string
          primary_language: string
          scores: Json
          secondary_language: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          partner_link_id: string
          primary_language: string
          scores?: Json
          secondary_language: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          partner_link_id?: string
          primary_language?: string
          scores?: Json
          secondary_language?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "love_language_results_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      luna_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      message_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          feedback_type: string | null
          id: string
          message_id: string | null
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          message_id?: string | null
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          message_id?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_entries: {
        Row: {
          created_at: string
          id: string
          mood_label: string
          mood_level: number
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood_label: string
          mood_level: number
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood_label?: string
          mood_level?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mood_prompts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          mood_category: string | null
          prompt_text: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          mood_category?: string | null
          prompt_text: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          mood_category?: string | null
          prompt_text?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      never_have_i_ever_sessions: {
        Row: {
          answers: Json | null
          created_at: string | null
          current_statement: string | null
          id: string
          is_spicy: boolean | null
          partner_link_id: string
          started_by: string
          statement_index: number | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          current_statement?: string | null
          id?: string
          is_spicy?: boolean | null
          partner_link_id: string
          started_by: string
          statement_index?: number | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          current_statement?: string | null
          id?: string
          is_spicy?: boolean | null
          partner_link_id?: string
          started_by?: string
          statement_index?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "never_have_i_ever_sessions_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_gifts: {
        Row: {
          created_at: string | null
          gift_id: string
          id: string
          is_opened: boolean | null
          message: string | null
          opened_at: string | null
          partner_link_id: string
          recipient_id: string
          sender_id: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          created_at?: string | null
          gift_id: string
          id?: string
          is_opened?: boolean | null
          message?: string | null
          opened_at?: string | null
          partner_link_id: string
          recipient_id: string
          sender_id: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          created_at?: string | null
          gift_id?: string
          id?: string
          is_opened?: boolean | null
          message?: string | null
          opened_at?: string | null
          partner_link_id?: string
          recipient_id?: string
          sender_id?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_gifts_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "digital_gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_gifts_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_links: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invite_code: string
          invite_email: string | null
          partner_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invite_code: string
          invite_email?: string | null
          partner_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invite_code?: string
          invite_email?: string | null
          partner_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_suggestions: {
        Row: {
          action_hint: string | null
          created_at: string
          expires_at: string
          for_user_id: string
          from_user_id: string
          id: string
          is_acted_on: boolean | null
          is_dismissed: boolean | null
          is_read: boolean | null
          partner_link_id: string
          suggestion_text: string
          suggestion_type: string
        }
        Insert: {
          action_hint?: string | null
          created_at?: string
          expires_at?: string
          for_user_id: string
          from_user_id: string
          id?: string
          is_acted_on?: boolean | null
          is_dismissed?: boolean | null
          is_read?: boolean | null
          partner_link_id: string
          suggestion_text: string
          suggestion_type: string
        }
        Update: {
          action_hint?: string | null
          created_at?: string
          expires_at?: string
          for_user_id?: string
          from_user_id?: string
          id?: string
          is_acted_on?: boolean | null
          is_dismissed?: boolean | null
          is_read?: boolean | null
          partner_link_id?: string
          suggestion_text?: string
          suggestion_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_suggestions_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          id: string
          phone_number: string | null
          phone_verified: boolean | null
          reminder_enabled: boolean | null
          reminder_time: string | null
          sexual_orientation: string | null
          sms_notification_preferences: Json | null
          sms_notifications_enabled: boolean | null
          suspended: boolean | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          user_id: string
          weekly_insights_enabled: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          sexual_orientation?: string | null
          sms_notification_preferences?: Json | null
          sms_notifications_enabled?: boolean | null
          suspended?: boolean | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id: string
          weekly_insights_enabled?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          sexual_orientation?: string | null
          sms_notification_preferences?: Json | null
          sms_notifications_enabled?: boolean | null
          suspended?: boolean | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id?: string
          weekly_insights_enabled?: boolean | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_self_answers: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string | null
          id: string
          partner_link_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string | null
          id?: string
          partner_link_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string | null
          id?: string
          partner_link_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_self_answers_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_assessments: {
        Row: {
          assessment_date: string
          communication_answers: Json
          communication_score: number
          completed_at: string | null
          conflict_answers: Json
          conflict_score: number
          created_at: string | null
          id: string
          intimacy_answers: Json
          intimacy_score: number
          partner_link_id: string
          trust_answers: Json
          trust_score: number
          user_id: string
        }
        Insert: {
          assessment_date?: string
          communication_answers?: Json
          communication_score: number
          completed_at?: string | null
          conflict_answers?: Json
          conflict_score: number
          created_at?: string | null
          id?: string
          intimacy_answers?: Json
          intimacy_score: number
          partner_link_id: string
          trust_answers?: Json
          trust_score: number
          user_id: string
        }
        Update: {
          assessment_date?: string
          communication_answers?: Json
          communication_score?: number
          completed_at?: string | null
          conflict_answers?: Json
          conflict_score?: number
          created_at?: string | null
          id?: string
          intimacy_answers?: Json
          intimacy_score?: number
          partner_link_id?: string
          trust_answers?: Json
          trust_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_assessments_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_health_scores: {
        Row: {
          communication_score: number | null
          conflict_resolution_score: number | null
          created_at: string | null
          id: string
          intimacy_score: number | null
          last_assessment_at: string | null
          overall_score: number | null
          partner_link_id: string
          trust_score: number | null
          updated_at: string | null
        }
        Insert: {
          communication_score?: number | null
          conflict_resolution_score?: number | null
          created_at?: string | null
          id?: string
          intimacy_score?: number | null
          last_assessment_at?: string | null
          overall_score?: number | null
          partner_link_id: string
          trust_score?: number | null
          updated_at?: string | null
        }
        Update: {
          communication_score?: number | null
          conflict_resolution_score?: number | null
          created_at?: string | null
          id?: string
          intimacy_score?: number | null
          last_assessment_at?: string | null
          overall_score?: number | null
          partner_link_id?: string
          trust_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationship_health_scores_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_milestones: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          is_recurring: boolean
          milestone_date: string
          partner_link_id: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          is_recurring?: boolean
          milestone_date: string
          partner_link_id: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_recurring?: boolean
          milestone_date?: string
          partner_link_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_milestones_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_tips: {
        Row: {
          author: string | null
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          author?: string | null
          category?: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          author?: string | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      scheduled_sms: {
        Row: {
          created_at: string
          created_by: string
          error_message: string | null
          id: string
          message: string
          phone_number: string
          recipient_type: string
          scheduled_at: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          error_message?: string | null
          id?: string
          message: string
          phone_number: string
          recipient_type?: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          error_message?: string | null
          id?: string
          message?: string
          phone_number?: string
          recipient_type?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shared_activities: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          id: string
          instructions: Json | null
          is_active: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: Json | null
          is_active?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: Json | null
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      shared_mood_entries: {
        Row: {
          created_at: string | null
          id: string
          is_visible_to_partner: boolean | null
          mood_label: string
          mood_level: number
          notes: string | null
          partner_link_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_visible_to_partner?: boolean | null
          mood_label: string
          mood_level: number
          notes?: string | null
          partner_link_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_visible_to_partner?: boolean | null
          mood_label?: string
          mood_level?: number
          notes?: string | null
          partner_link_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_mood_entries_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_delivery_logs: {
        Row: {
          error_message: string | null
          id: string
          message: string
          phone_number: string
          sent_at: string
          sent_by: string | null
          status: string
          twilio_sid: string | null
          user_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          message: string
          phone_number: string
          sent_at?: string
          sent_by?: string | null
          status?: string
          twilio_sid?: string | null
          user_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          message?: string
          phone_number?: string
          sent_at?: string
          sent_by?: string | null
          status?: string
          twilio_sid?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          message: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone_number: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_number: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_number?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          price_monthly: number
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          price_monthly?: number
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      this_or_that_sessions: {
        Row: {
          created_at: string | null
          current_question_index: number | null
          id: string
          partner_link_id: string
          player_answers: Json | null
          started_by: string
          total_questions: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_question_index?: number | null
          id?: string
          partner_link_id: string
          player_answers?: Json | null
          started_by: string
          total_questions?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_question_index?: number | null
          id?: string
          partner_link_id?: string
          player_answers?: Json | null
          started_by?: string
          total_questions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "this_or_that_sessions_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      time_capsule_messages: {
        Row: {
          created_at: string
          deliver_at: string
          delivered_at: string | null
          id: string
          is_delivered: boolean
          is_opened: boolean
          message: string
          opened_at: string | null
          partner_link_id: string
          recipient_id: string
          sender_id: string
          updated_at: string
          video_url: string | null
          voice_url: string | null
        }
        Insert: {
          created_at?: string
          deliver_at: string
          delivered_at?: string | null
          id?: string
          is_delivered?: boolean
          is_opened?: boolean
          message: string
          opened_at?: string | null
          partner_link_id: string
          recipient_id: string
          sender_id: string
          updated_at?: string
          video_url?: string | null
          voice_url?: string | null
        }
        Update: {
          created_at?: string
          deliver_at?: string
          delivered_at?: string | null
          id?: string
          is_delivered?: boolean
          is_opened?: boolean
          message?: string
          opened_at?: string | null
          partner_link_id?: string
          recipient_id?: string
          sender_id?: string
          updated_at?: string
          video_url?: string | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_capsule_messages_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      truth_or_dare_sessions: {
        Row: {
          created_at: string | null
          current_card_index: number | null
          current_prompt: string | null
          id: string
          is_spicy: boolean | null
          mode: string | null
          partner_link_id: string
          player_answers: Json | null
          player_ready: Json | null
          started_by: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_card_index?: number | null
          current_prompt?: string | null
          id?: string
          is_spicy?: boolean | null
          mode?: string | null
          partner_link_id: string
          player_answers?: Json | null
          player_ready?: Json | null
          started_by: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_card_index?: number | null
          current_prompt?: string | null
          id?: string
          is_spicy?: boolean | null
          mode?: string | null
          partner_link_id?: string
          player_answers?: Json | null
          player_ready?: Json | null
          started_by?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "truth_or_dare_sessions_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
      user_coins: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          lifetime_earned: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          lifetime_earned?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          lifetime_earned?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          communication_style: string | null
          created_at: string | null
          desired_outcome: string | null
          id: string
          relationship_reason: string | null
          relationship_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          communication_style?: string | null
          created_at?: string | null
          desired_outcome?: string | null
          id?: string
          relationship_reason?: string | null
          relationship_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          communication_style?: string | null
          created_at?: string | null
          desired_outcome?: string | null
          id?: string
          relationship_reason?: string | null
          relationship_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          source: string
          started_at: string | null
          status: string
          tier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          source?: string
          started_at?: string | null
          status?: string
          tier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          source?: string
          started_at?: string | null
          status?: string
          tier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      would_you_rather_answers: {
        Row: {
          created_at: string
          id: string
          partner_link_id: string
          question_index: number
          selected_option: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_link_id: string
          question_index: number
          selected_option: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_link_id?: string
          question_index?: number
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "would_you_rather_answers_partner_link_id_fkey"
            columns: ["partner_link_id"]
            isOneToOne: false
            referencedRelation: "partner_links"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: { Args: never; Returns: string }
      get_pending_invite_by_code: {
        Args: { p_invite_code: string }
        Returns: {
          created_at: string
          id: string
          invite_code: string
          status: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
