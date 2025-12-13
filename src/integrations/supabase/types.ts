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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          reminder_enabled: boolean | null
          reminder_time: string | null
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
          id?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
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
          id?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
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
