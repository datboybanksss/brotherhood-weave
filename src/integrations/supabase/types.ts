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
      archives: {
        Row: {
          body_markdown: string | null
          content_type: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          curator_note: string | null
          description: string | null
          document_filename: string | null
          document_url: string | null
          domain: string | null
          id: string
          is_published: boolean
          read_time_minutes: number | null
          recorded_at: string
          title: string
          video_url: string | null
        }
        Insert: {
          body_markdown?: string | null
          content_type?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          curator_note?: string | null
          description?: string | null
          document_filename?: string | null
          document_url?: string | null
          domain?: string | null
          id?: string
          is_published?: boolean
          read_time_minutes?: number | null
          recorded_at: string
          title: string
          video_url?: string | null
        }
        Update: {
          body_markdown?: string | null
          content_type?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          curator_note?: string | null
          description?: string | null
          document_filename?: string | null
          document_url?: string | null
          domain?: string | null
          id?: string
          is_published?: boolean
          read_time_minutes?: number | null
          recorded_at?: string
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          is_muted: boolean
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_type: Database["public"]["Enums"]["channel_type_enum"]
          created_at: string
          department_id: string | null
          description: string | null
          display_order: number
          id: string
          is_admin_post_only: boolean
          name: string
          slug: string
        }
        Insert: {
          channel_type: Database["public"]["Enums"]["channel_type_enum"]
          created_at?: string
          department_id?: string | null
          description?: string | null
          display_order: number
          id?: string
          is_admin_post_only?: boolean
          name: string
          slug: string
        }
        Update: {
          channel_type?: Database["public"]["Enums"]["channel_type_enum"]
          created_at?: string
          department_id?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_admin_post_only?: boolean
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string
          full_name: string
          id: string
          intended_tier: string
          is_admin: boolean
          revoked_at: string | null
          token: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          intended_tier?: string
          is_admin?: boolean
          revoked_at?: string | null
          token: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          intended_tier?: string
          is_admin?: boolean
          revoked_at?: string | null
          token?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_used_by_user_id_fkey"
            columns: ["used_by_user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_used_by_user_id_fkey"
            columns: ["used_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body_markdown: string | null
          display_order: number
          duration_seconds: number | null
          id: string
          is_released: boolean
          module_id: string
          release_date: string | null
          title: string
          video_url: string | null
          worksheet_pdf_url: string | null
        }
        Insert: {
          body_markdown?: string | null
          display_order: number
          duration_seconds?: number | null
          id?: string
          is_released?: boolean
          module_id: string
          release_date?: string | null
          title: string
          video_url?: string | null
          worksheet_pdf_url?: string | null
        }
        Update: {
          body_markdown?: string | null
          display_order?: number
          duration_seconds?: number | null
          id?: string
          is_released?: boolean
          module_id?: string
          release_date?: string | null
          title?: string
          video_url?: string | null
          worksheet_pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendance: {
        Row: {
          attended: boolean
          marked_by: string | null
          meeting_id: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          marked_by?: string | null
          meeting_id: string
          user_id: string
        }
        Update: {
          attended?: boolean
          marked_by?: string | null
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_by: string | null
          id: string
          scheduled_at: string
          title: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          scheduled_at: string
          title: string
        }
        Update: {
          created_by?: string | null
          id?: string
          scheduled_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          channel_id: string
          client_temp_id: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          channel_id: string
          client_temp_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          channel_id?: string
          client_temp_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          description: string | null
          display_order: number
          id: string
          required_tier_id: string | null
          slug: string
          title: string
        }
        Insert: {
          description?: string | null
          display_order: number
          id?: string
          required_tier_id?: string | null
          slug: string
          title: string
        }
        Update: {
          description?: string | null
          display_order?: number
          id?: string
          required_tier_id?: string | null
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_required_tier_id_fkey"
            columns: ["required_tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          provider: string
          status: Database["public"]["Enums"]["payment_txn_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          provider?: string
          status?: Database["public"]["Enums"]["payment_txn_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          provider?: string
          status?: Database["public"]["Enums"]["payment_txn_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_pairings: {
        Row: {
          created_at: string
          id: string
          is_trio: boolean
          member_a_id: string
          member_b_id: string
          member_c_id: string | null
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_trio?: boolean
          member_a_id: string
          member_b_id: string
          member_c_id?: string | null
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          is_trio?: boolean
          member_a_id?: string
          member_b_id?: string
          member_c_id?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_pairings_member_a_id_fkey"
            columns: ["member_a_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_pairings_member_a_id_fkey"
            columns: ["member_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_pairings_member_b_id_fkey"
            columns: ["member_b_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_pairings_member_b_id_fkey"
            columns: ["member_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_pairings_member_c_id_fkey"
            columns: ["member_c_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_pairings_member_c_id_fkey"
            columns: ["member_c_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          author_id: string
          body_markdown: string
          category: Database["public"]["Enums"]["playbook_category"]
          created_at: string
          id: string
          is_published: boolean
          last_reviewed_at: string
          pdf_attachment_url: string | null
          slug: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body_markdown: string
          category: Database["public"]["Enums"]["playbook_category"]
          created_at?: string
          id?: string
          is_published?: boolean
          last_reviewed_at?: string
          pdf_attachment_url?: string | null
          slug: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body_markdown?: string
          category?: Database["public"]["Enums"]["playbook_category"]
          created_at?: string
          id?: string
          is_published?: boolean
          last_reviewed_at?: string
          pdf_attachment_url?: string | null
          slug?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbooks_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strava_connections: {
        Row: {
          access_token: string
          connected_at: string
          expires_at: string
          last_synced_at: string | null
          refresh_token: string
          scope: string
          strava_athlete_id: number
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          expires_at: string
          last_synced_at?: string | null
          refresh_token: string
          scope: string
          strava_athlete_id: number
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          expires_at?: string
          last_synced_at?: string | null
          refresh_token?: string
          scope?: string
          strava_athlete_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strava_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strava_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strava_webhook_events: {
        Row: {
          aspect_type: string
          error_message: string | null
          event_time: number | null
          id: string
          object_id: number
          object_type: string
          owner_id: number
          processed_at: string | null
          raw_body: Json
          received_at: string
          subscription_id: number | null
        }
        Insert: {
          aspect_type: string
          error_message?: string | null
          event_time?: number | null
          id?: string
          object_id: number
          object_type: string
          owner_id: number
          processed_at?: string | null
          raw_body: Json
          received_at?: string
          subscription_id?: number | null
        }
        Update: {
          aspect_type?: string
          error_message?: string | null
          event_time?: number | null
          id?: string
          object_id?: number
          object_type?: string
          owner_id?: number
          processed_at?: string | null
          raw_body?: Json
          received_at?: string
          subscription_id?: number | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          event_id: string | null
          exercise: string
          id: string
          note: string | null
          reps: number
          submitted_at: string
          user_id: string
          video_retention: string
          video_url: string | null
          video_visibility: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          exercise: string
          id?: string
          note?: string | null
          reps: number
          submitted_at?: string
          user_id: string
          video_retention?: string
          video_url?: string | null
          video_visibility?: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          exercise?: string
          id?: string
          note?: string | null
          reps?: number
          submitted_at?: string
          user_id?: string
          video_retention?: string
          video_url?: string | null
          video_visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tiers: {
        Row: {
          display_order: number
          id: string
          name: string
          ring_color: string
        }
        Insert: {
          display_order: number
          id?: string
          name: string
          ring_color: string
        }
        Update: {
          display_order?: number
          id?: string
          name?: string
          ring_color?: string
        }
        Relationships: []
      }
      user_departments: {
        Row: {
          department_id: string
          is_primary: boolean
          user_id: string
        }
        Insert: {
          department_id: string
          is_primary?: boolean
          user_id: string
        }
        Update: {
          department_id?: string
          is_primary?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_progress: {
        Row: {
          completed_at: string | null
          id: string
          lessons_completed: number
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lessons_completed?: number
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lessons_completed?: number
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_city: string | null
          email: string
          email_visible: boolean
          full_name: string
          id: string
          interview_booked_at: string | null
          interview_completed: boolean
          invited_via_token: string | null
          is_admin: boolean
          membership_started_at: string | null
          onboarded_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status_enum"]
          rejected_at: string | null
          tier_id: string | null
          title: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_city?: string | null
          email: string
          email_visible?: boolean
          full_name: string
          id: string
          interview_booked_at?: string | null
          interview_completed?: boolean
          invited_via_token?: string | null
          is_admin?: boolean
          membership_started_at?: string | null
          onboarded_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          rejected_at?: string | null
          tier_id?: string | null
          title?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_city?: string | null
          email?: string
          email_visible?: boolean
          full_name?: string
          id?: string
          interview_booked_at?: string | null
          interview_completed?: boolean
          invited_via_token?: string | null
          is_admin?: boolean
          membership_started_at?: string | null
          onboarded_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          rejected_at?: string | null
          tier_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          activity_type: string | null
          created_at: string
          distance_km: number
          duration_seconds: number | null
          id: string
          note: string | null
          ran_at: string
          strava_activity_id: number | null
          user_id: string
          verified_via: string | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          distance_km: number
          duration_seconds?: number | null
          id?: string
          note?: string | null
          ran_at: string
          strava_activity_id?: number | null
          user_id: string
          verified_via?: string | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          distance_km?: number
          duration_seconds?: number | null
          id?: string
          note?: string | null
          ran_at?: string
          strava_activity_id?: number | null
          user_id?: string
          verified_via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_member_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_city: string | null
          email_visible: boolean | null
          full_name: string | null
          id: string | null
          membership_started_at: string | null
          tier_id: string | null
          title: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_city?: string | null
          email_visible?: boolean | null
          full_name?: string | null
          id?: string | null
          membership_started_at?: string | null
          tier_id?: string | null
          title?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_city?: string | null
          email_visible?: boolean | null
          full_name?: string | null
          id?: string | null
          membership_started_at?: string | null
          tier_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      evaluate_tier_upgrade: { Args: { target_user_id: string }; Returns: Json }
      get_collective_distance: { Args: never; Returns: number }
      get_monthly_leaderboard: {
        Args: { month_start: string }
        Returns: {
          avatar_url: string
          full_name: string
          score: number
          submission_count: number
          tier_id: string
          total_reps: number
          user_id: string
          video_count: number
        }[]
      }
      get_unread_count: {
        Args: { _channel_id: string; _user_id: string }
        Returns: number
      }
      get_user_monthly_stats: {
        Args: { _user_id: string; month_start: string }
        Returns: {
          rank: number
          submission_count: number
          total_reps: number
          video_count: number
        }[]
      }
      get_user_weekly_streak: { Args: { _user_id: string }; Returns: number }
      get_weekly_forfeit_list: {
        Args: { week_start: string }
        Returns: {
          avatar_url: string
          full_name: string
          last_submission_at: string
          tier_id: string
          user_id: string
        }[]
      }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      process_payment: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reorder_profile_photos: {
        Args: { _photo_ids: string[] }
        Returns: undefined
      }
    }
    Enums: {
      channel_type_enum: "general" | "announcements" | "department"
      payment_status_enum: "pending" | "paid"
      payment_txn_status: "pending" | "completed" | "failed"
      playbook_category:
        | "money"
        | "career"
        | "relationships"
        | "health"
        | "mindset"
        | "craft"
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
      channel_type_enum: ["general", "announcements", "department"],
      payment_status_enum: ["pending", "paid"],
      payment_txn_status: ["pending", "completed", "failed"],
      playbook_category: [
        "money",
        "career",
        "relationships",
        "health",
        "mindset",
        "craft",
      ],
    },
  },
} as const
