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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string
          availability: string | null
          brand_note: string | null
          campaign_id: string
          content_idea: string | null
          creator_id: string
          id: string
          message: string
          proposed_rate: number | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          availability?: string | null
          brand_note?: string | null
          campaign_id: string
          content_idea?: string | null
          creator_id: string
          id?: string
          message?: string
          proposed_rate?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          availability?: string | null
          brand_note?: string | null
          campaign_id?: string
          content_idea?: string | null
          creator_id?: string
          id?: string
          message?: string
          proposed_rate?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          description: string | null
          industry: string | null
          location: string | null
          logo_url: string | null
          profile_id: string
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          profile_id: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          profile_id?: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          application_deadline: string | null
          brand_id: string
          budget: number | null
          campaign_end_date: string | null
          campaign_start_date: string | null
          category: string | null
          cover_image: string | null
          created_at: string
          creators_needed: number
          currency: string
          deliverables: string[]
          description: string
          id: string
          location: string | null
          min_followers: number
          perks: string[]
          platforms: string[]
          remote: boolean
          requirements: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          brand_id: string
          budget?: number | null
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          creators_needed?: number
          currency?: string
          deliverables?: string[]
          description?: string
          id?: string
          location?: string | null
          min_followers?: number
          perks?: string[]
          platforms?: string[]
          remote?: boolean
          requirements?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          brand_id?: string
          budget?: number | null
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          creators_needed?: number
          currency?: string
          deliverables?: string[]
          description?: string
          id?: string
          location?: string | null
          min_followers?: number
          perks?: string[]
          platforms?: string[]
          remote?: boolean
          requirements?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborations: {
        Row: {
          agreed_budget: number | null
          brand_id: string
          campaign_id: string
          created_at: string
          creator_id: string
          deliverables: string[]
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agreed_budget?: number | null
          brand_id: string
          campaign_id: string
          created_at?: string
          creator_id: string
          deliverables?: string[]
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agreed_budget?: number | null
          brand_id?: string
          campaign_id?: string
          created_at?: string
          creator_id?: string
          deliverables?: string[]
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          brand_id: string
          campaign_id: string | null
          created_at: string
          creator_id: string
          id: string
          last_message_at: string
        }
        Insert: {
          brand_id: string
          campaign_id?: string | null
          created_at?: string
          creator_id: string
          id?: string
          last_message_at?: string
        }
        Update: {
          brand_id?: string
          campaign_id?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          last_message_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          audience_size: number
          available: boolean
          category: string | null
          created_at: string
          engagement_rate: number
          facebook_url: string | null
          headline: string | null
          instagram_url: string | null
          languages: string[]
          niches: string[]
          platforms: string[]
          profile_id: string
          skills: string[]
          tiktok_url: string | null
          updated_at: string
          verified: boolean
          youtube_url: string | null
        }
        Insert: {
          audience_size?: number
          available?: boolean
          category?: string | null
          created_at?: string
          engagement_rate?: number
          facebook_url?: string | null
          headline?: string | null
          instagram_url?: string | null
          languages?: string[]
          niches?: string[]
          platforms?: string[]
          profile_id: string
          skills?: string[]
          tiktok_url?: string | null
          updated_at?: string
          verified?: boolean
          youtube_url?: string | null
        }
        Update: {
          audience_size?: number
          available?: boolean
          category?: string | null
          created_at?: string
          engagement_rate?: number
          facebook_url?: string | null
          headline?: string | null
          instagram_url?: string | null
          languages?: string[]
          niches?: string[]
          platforms?: string[]
          profile_id?: string
          skills?: string[]
          tiktok_url?: string | null
          updated_at?: string
          verified?: boolean
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
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
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          external_url: string | null
          id: string
          media_url: string | null
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          external_url?: string | null
          id?: string
          media_url?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          external_url?: string | null
          id?: string
          media_url?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          onboarded: boolean
          role: string | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          location?: string | null
          onboarded?: boolean
          role?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          onboarded?: boolean
          role?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          collaboration_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          collaboration_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          collaboration_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_campaigns: {
        Row: {
          campaign_id: string
          created_at: string
          creator_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          creator_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          creator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_campaigns_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_application: { Args: { _application_id: string }; Returns: string }
      current_role_is: { Args: { _role: string }; Returns: boolean }
      in_conversation: { Args: { _conversation_id: string }; Returns: boolean }
      owns_campaign: { Args: { _campaign_id: string }; Returns: boolean }
      push_notification: {
        Args: {
          _body: string
          _link: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
