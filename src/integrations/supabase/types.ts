export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          id: string | null
          admin_id: string | null
          action: string | null
          target_type: string | null
          target_id: string | null
          details: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          admin_id?: string | null
          action?: string | null
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          admin_id?: string | null
          action?: string | null
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string | null
          campaign_id: string | null
          creator_id: string | null
          pitch: string | null
          status: string | null
          brand_remarks: string | null
          creator_remarks: string | null
          applied_at: string | null
          updated_at: string | null
          message: string | null
          created_at: string | null
          content_idea: string | null
          availability: string | null
          note: string | null
        }
        Insert: {
          id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          pitch?: string | null
          status?: string | null
          brand_remarks?: string | null
          creator_remarks?: string | null
          applied_at?: string | null
          updated_at?: string | null
          message?: string | null
          created_at?: string | null
          content_idea?: string | null
          availability?: string | null
          note?: string | null
        }
        Update: {
          id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          pitch?: string | null
          status?: string | null
          brand_remarks?: string | null
          creator_remarks?: string | null
          applied_at?: string | null
          updated_at?: string | null
          message?: string | null
          created_at?: string | null
          content_idea?: string | null
          availability?: string | null
          note?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string | null
          actor_id: string | null
          action: string | null
          entity_type: string | null
          entity_id: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          actor_id?: string | null
          action?: string | null
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          actor_id?: string | null
          action?: string | null
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          user_id: string | null
          business_name: string | null
          category: string | null
          website: string | null
          social_url: string | null
          registration_number: string | null
          team_size: number | null
          updated_at: string | null
          featured: boolean | null
        }
        Insert: {
          user_id?: string | null
          business_name?: string | null
          category?: string | null
          website?: string | null
          social_url?: string | null
          registration_number?: string | null
          team_size?: number | null
          updated_at?: string | null
          featured?: boolean | null
        }
        Update: {
          user_id?: string | null
          business_name?: string | null
          category?: string | null
          website?: string | null
          social_url?: string | null
          registration_number?: string | null
          team_size?: number | null
          updated_at?: string | null
          featured?: boolean | null
        }
        Relationships: []
      }
      campaign_invites: {
        Row: {
          id: string | null
          campaign_id: string | null
          creator_id: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          status?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      campaign_saves: {
        Row: {
          id: string | null
          campaign_id: string | null
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          campaign_id?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          campaign_id?: string | null
          user_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string | null
          brand_id: string | null
          title: string | null
          description: string | null
          category: string | null
          location: string | null
          platforms: string[] | null
          campaign_type: string | null
          spots: number | null
          deadline: string | null
          deliverables: string[] | null
          requirements: Json | null
          remarks: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          objective: string | null
          type: string | null
          budget: number | null
          creator_reward: number | null
          revision_limit: number | null
          brief: string | null
          image_url: string | null
          min_followers: number | null
          visibility: string | null
          views: number | null
          saves: number | null
          currency: string | null
          content_types: string[] | null
          perks: string[] | null
          remote: boolean | null
          campaign_start: string | null
          campaign_end: string | null
          featured: boolean | null
        }
        Insert: {
          id?: string | null
          brand_id?: string | null
          title?: string | null
          description?: string | null
          category?: string | null
          location?: string | null
          platforms?: string[] | null
          campaign_type?: string | null
          spots?: number | null
          deadline?: string | null
          deliverables?: string[] | null
          requirements?: Json | null
          remarks?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          objective?: string | null
          type?: string | null
          budget?: number | null
          creator_reward?: number | null
          revision_limit?: number | null
          brief?: string | null
          image_url?: string | null
          min_followers?: number | null
          visibility?: string | null
          views?: number | null
          saves?: number | null
          currency?: string | null
          content_types?: string[] | null
          perks?: string[] | null
          remote?: boolean | null
          campaign_start?: string | null
          campaign_end?: string | null
          featured?: boolean | null
        }
        Update: {
          id?: string | null
          brand_id?: string | null
          title?: string | null
          description?: string | null
          category?: string | null
          location?: string | null
          platforms?: string[] | null
          campaign_type?: string | null
          spots?: number | null
          deadline?: string | null
          deliverables?: string[] | null
          requirements?: Json | null
          remarks?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          objective?: string | null
          type?: string | null
          budget?: number | null
          creator_reward?: number | null
          revision_limit?: number | null
          brief?: string | null
          image_url?: string | null
          min_followers?: number | null
          visibility?: string | null
          views?: number | null
          saves?: number | null
          currency?: string | null
          content_types?: string[] | null
          perks?: string[] | null
          remote?: boolean | null
          campaign_start?: string | null
          campaign_end?: string | null
          featured?: boolean | null
        }
        Relationships: []
      }
      collaborations: {
        Row: {
          id: string | null
          application_id: string | null
          campaign_id: string | null
          creator_id: string | null
          brand_id: string | null
          status: string | null
          deadline: string | null
          brand_remarks: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          application_id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          brand_id?: string | null
          status?: string | null
          deadline?: string | null
          brand_remarks?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          application_id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          brand_id?: string | null
          status?: string | null
          deadline?: string | null
          brand_remarks?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string | null
          user_id: string | null
          member_role: string | null
          joined_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          user_id?: string | null
          member_role?: string | null
          joined_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          user_id?: string | null
          member_role?: string | null
          joined_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string | null
          campaign_id: string | null
          creator_id: string | null
          brand_id: string | null
          created_at: string | null
          updated_at: string | null
          application_id: string | null
        }
        Insert: {
          id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          application_id?: string | null
        }
        Update: {
          id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          application_id?: string | null
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          user_id: string | null
          niches: string[] | null
          platforms: string[] | null
          followers: number | null
          engagement_rate: number | null
          average_views: number | null
          starting_rate: number | null
          languages: string[] | null
          portfolio_urls: string[] | null
          availability: string | null
          media_kit_url: string | null
          social_verified: boolean | null
          updated_at: string | null
          featured: boolean | null
        }
        Insert: {
          user_id?: string | null
          niches?: string[] | null
          platforms?: string[] | null
          followers?: number | null
          engagement_rate?: number | null
          average_views?: number | null
          starting_rate?: number | null
          languages?: string[] | null
          portfolio_urls?: string[] | null
          availability?: string | null
          media_kit_url?: string | null
          social_verified?: boolean | null
          updated_at?: string | null
          featured?: boolean | null
        }
        Update: {
          user_id?: string | null
          niches?: string[] | null
          platforms?: string[] | null
          followers?: number | null
          engagement_rate?: number | null
          average_views?: number | null
          starting_rate?: number | null
          languages?: string[] | null
          portfolio_urls?: string[] | null
          availability?: string | null
          media_kit_url?: string | null
          social_verified?: boolean | null
          updated_at?: string | null
          featured?: boolean | null
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          id: string | null
          application_id: string | null
          title: string | null
          kind: string | null
          due_at: string | null
          status: string | null
          created_at: string | null
          platform: string | null
          instructions: string | null
          submission_note: string | null
          submission_link: string | null
          submitted_at: string | null
        }
        Insert: {
          id?: string | null
          application_id?: string | null
          title?: string | null
          kind?: string | null
          due_at?: string | null
          status?: string | null
          created_at?: string | null
          platform?: string | null
          instructions?: string | null
          submission_note?: string | null
          submission_link?: string | null
          submitted_at?: string | null
        }
        Update: {
          id?: string | null
          application_id?: string | null
          title?: string | null
          kind?: string | null
          due_at?: string | null
          status?: string | null
          created_at?: string | null
          platform?: string | null
          instructions?: string | null
          submission_note?: string | null
          submission_link?: string | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          id: string | null
          collaboration_id: string | null
          opened_by: string | null
          reason: string | null
          details: string | null
          evidence_urls: string[] | null
          status: string | null
          resolution: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          collaboration_id?: string | null
          opened_by?: string | null
          reason?: string | null
          details?: string | null
          evidence_urls?: string[] | null
          status?: string | null
          resolution?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          collaboration_id?: string | null
          opened_by?: string | null
          reason?: string | null
          details?: string | null
          evidence_urls?: string[] | null
          status?: string | null
          resolution?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string | null
          conversation_id: string | null
          sender_id: string | null
          body: string | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          conversation_id?: string | null
          sender_id?: string | null
          body?: string | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          conversation_id?: string | null
          sender_id?: string | null
          body?: string | null
          read_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string | null
          user_id: string | null
          type: string | null
          title: string | null
          body: string | null
          data: Json | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          type?: string | null
          title?: string | null
          body?: string | null
          data?: Json | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          type?: string | null
          title?: string | null
          body?: string | null
          data?: Json | null
          read_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string | null
          value: string | null
          description: string | null
          updated_at: string | null
        }
        Insert: {
          key?: string | null
          value?: string | null
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          key?: string | null
          value?: string | null
          description?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          id: string | null
          creator_id: string | null
          title: string | null
          description: string | null
          media_path: string | null
          thumbnail_path: string | null
          external_url: string | null
          platform: string | null
          category: string | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          creator_id?: string | null
          title?: string | null
          description?: string | null
          media_path?: string | null
          thumbnail_path?: string | null
          external_url?: string | null
          platform?: string | null
          category?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          creator_id?: string | null
          title?: string | null
          description?: string | null
          media_path?: string | null
          thumbnail_path?: string | null
          external_url?: string | null
          platform?: string | null
          category?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string | null
          role: string | null
          full_name: string | null
          username: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          verified: boolean | null
          verification_status: string | null
          rating: number | null
          review_count: number | null
          completion_rate: number | null
          response_rate: number | null
          created_at: string | null
          updated_at: string | null
          onboarded: boolean | null
          suspended: boolean | null
          suspended_at: string | null
          suspended_reason: string | null
          admin_notes: string | null
          featured: boolean | null
        }
        Insert: {
          id?: string | null
          role?: string | null
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          verified?: boolean | null
          verification_status?: string | null
          rating?: number | null
          review_count?: number | null
          completion_rate?: number | null
          response_rate?: number | null
          created_at?: string | null
          updated_at?: string | null
          onboarded?: boolean | null
          suspended?: boolean | null
          suspended_at?: string | null
          suspended_reason?: string | null
          admin_notes?: string | null
          featured?: boolean | null
        }
        Update: {
          id?: string | null
          role?: string | null
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          verified?: boolean | null
          verification_status?: string | null
          rating?: number | null
          review_count?: number | null
          completion_rate?: number | null
          response_rate?: number | null
          created_at?: string | null
          updated_at?: string | null
          onboarded?: boolean | null
          suspended?: boolean | null
          suspended_at?: string | null
          suspended_reason?: string | null
          admin_notes?: string | null
          featured?: boolean | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string | null
          referrer_id: string | null
          referred_id: string | null
          code: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          referrer_id?: string | null
          referred_id?: string | null
          code?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          referrer_id?: string | null
          referred_id?: string | null
          code?: string | null
          status?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string | null
          reporter_id: string | null
          reported_user_id: string | null
          campaign_id: string | null
          reason: string | null
          details: string | null
          status: string | null
          admin_note: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string | null
          severity: string | null
          admin_notes: string | null
        }
        Insert: {
          id?: string | null
          reporter_id?: string | null
          reported_user_id?: string | null
          campaign_id?: string | null
          reason?: string | null
          details?: string | null
          status?: string | null
          admin_note?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
          severity?: string | null
          admin_notes?: string | null
        }
        Update: {
          id?: string | null
          reporter_id?: string | null
          reported_user_id?: string | null
          campaign_id?: string | null
          reason?: string | null
          details?: string | null
          status?: string | null
          admin_note?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
          severity?: string | null
          admin_notes?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string | null
          collaboration_id: string | null
          reviewer_id: string | null
          reviewee_id: string | null
          rating: number | null
          comment: string | null
          created_at: string | null
          application_id: string | null
          campaign_id: string | null
        }
        Insert: {
          id?: string | null
          collaboration_id?: string | null
          reviewer_id?: string | null
          reviewee_id?: string | null
          rating?: number | null
          comment?: string | null
          created_at?: string | null
          application_id?: string | null
          campaign_id?: string | null
        }
        Update: {
          id?: string | null
          collaboration_id?: string | null
          reviewer_id?: string | null
          reviewee_id?: string | null
          rating?: number | null
          comment?: string | null
          created_at?: string | null
          application_id?: string | null
          campaign_id?: string | null
        }
        Relationships: []
      }
      saved_campaigns: {
        Row: {
          user_id: string | null
          campaign_id: string | null
          created_at: string | null
        }
        Insert: {
          user_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
        }
        Update: {
          user_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          id: string | null
          user_id: string | null
          platform: string | null
          handle: string | null
          profile_url: string | null
          followers: number | null
          engagement_rate: number | null
          verified: boolean | null
          access_token_encrypted: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          platform?: string | null
          handle?: string | null
          profile_url?: string | null
          followers?: number | null
          engagement_rate?: number | null
          verified?: boolean | null
          access_token_encrypted?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          platform?: string | null
          handle?: string | null
          profile_url?: string | null
          followers?: number | null
          engagement_rate?: number | null
          verified?: boolean | null
          access_token_encrypted?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          id: string | null
          collaboration_id: string | null
          creator_id: string | null
          content_url: string | null
          caption: string | null
          proof_url: string | null
          status: string | null
          brand_feedback: string | null
          admin_feedback: string | null
          submitted_at: string | null
          reviewed_at: string | null
          updated_at: string | null
          application_id: string | null
          url: string | null
          feedback: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          collaboration_id?: string | null
          creator_id?: string | null
          content_url?: string | null
          caption?: string | null
          proof_url?: string | null
          status?: string | null
          brand_feedback?: string | null
          admin_feedback?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          updated_at?: string | null
          application_id?: string | null
          url?: string | null
          feedback?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          collaboration_id?: string | null
          creator_id?: string | null
          content_url?: string | null
          caption?: string | null
          proof_url?: string | null
          status?: string | null
          brand_feedback?: string | null
          admin_feedback?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          updated_at?: string | null
          application_id?: string | null
          url?: string | null
          feedback?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          id: string | null
          user_id: string | null
          platform: string | null
          handle: string | null
          profile_url: string | null
          verification_code: string | null
          status: string | null
          admin_note: string | null
          verified_by: string | null
          verified_at: string | null
          created_at: string | null
          updated_at: string | null
          type: string | null
          documents: Json | null
          notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string | null
          user_id?: string | null
          platform?: string | null
          handle?: string | null
          profile_url?: string | null
          verification_code?: string | null
          status?: string | null
          admin_note?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          type?: string | null
          documents?: Json | null
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: string | null
          user_id?: string | null
          platform?: string | null
          handle?: string | null
          profile_url?: string | null
          verification_code?: string | null
          status?: string | null
          admin_note?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          type?: string | null
          documents?: Json | null
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      accept_application: { Args: { _application_id: string }; Returns: string }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      bootstrap_first_admin: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]
export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"]