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
      agents: {
        Row: {
          config: Json
          created_at: string
          description: string
          domain: string
          icon: string
          id: string
          name: string
          org_id: string
          report_count: number
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string
          domain?: string
          icon?: string
          id: string
          name: string
          org_id: string
          report_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string
          domain?: string
          icon?: string
          id?: string
          name?: string
          org_id?: string
          report_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      flight_contexts: {
        Row: {
          author_id: string | null
          capture_mode: string
          flight_id: string
          id: string
          image_notes: Json
          last_edited_at: string
          marked_complete: boolean
          org_id: string
          site_id: string | null
          source: string
          started_at: string
          text: string
          word_count: number
        }
        Insert: {
          author_id?: string | null
          capture_mode?: string
          flight_id: string
          id?: string
          image_notes?: Json
          last_edited_at?: string
          marked_complete?: boolean
          org_id: string
          site_id?: string | null
          source?: string
          started_at?: string
          text?: string
          word_count?: number
        }
        Update: {
          author_id?: string | null
          capture_mode?: string
          flight_id?: string
          id?: string
          image_notes?: Json
          last_edited_at?: string
          marked_complete?: boolean
          org_id?: string
          site_id?: string | null
          source?: string
          started_at?: string
          text?: string
          word_count?: number
        }
        Relationships: []
      }
      flight_events: {
        Row: {
          event_id: string
          event_type: string
          flight_id: string
          org_id: string
          payload: Json
          received_at: string
          timestamp: string
        }
        Insert: {
          event_id: string
          event_type: string
          flight_id: string
          org_id: string
          payload: Json
          received_at?: string
          timestamp: string
        }
        Update: {
          event_id?: string
          event_type?: string
          flight_id?: string
          org_id?: string
          payload?: Json
          received_at?: string
          timestamp?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          agent_id: string | null
          agent_name: string
          author: string
          created_at: string
          date: string | null
          drone_name: string | null
          executive_summary: string
          flight_context_snapshot: Json | null
          flight_ids: Json
          id: string
          is_demo: boolean
          long_term_recommendations: Json
          mission_count: number
          mission_name: string | null
          observations: Json
          org_id: string
          profile: string
          sections: Json
          short_term_recommendations: Json
          site_name: string
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string
          author?: string
          created_at?: string
          date?: string | null
          drone_name?: string | null
          executive_summary?: string
          flight_context_snapshot?: Json | null
          flight_ids?: Json
          id: string
          is_demo?: boolean
          long_term_recommendations?: Json
          mission_count?: number
          mission_name?: string | null
          observations?: Json
          org_id: string
          profile?: string
          sections?: Json
          short_term_recommendations?: Json
          site_name?: string
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          agent_name?: string
          author?: string
          created_at?: string
          date?: string | null
          drone_name?: string | null
          executive_summary?: string
          flight_context_snapshot?: Json | null
          flight_ids?: Json
          id?: string
          is_demo?: boolean
          long_term_recommendations?: Json
          mission_count?: number
          mission_name?: string | null
          observations?: Json
          org_id?: string
          profile?: string
          sections?: Json
          short_term_recommendations?: Json
          site_name?: string
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          cover_style: string
          created_at: string
          description: string
          id: string
          is_default: boolean
          name: string
          org_id: string
          page_size: string
          preview_image_url: string | null
          sections: Json
          status: string
          updated_at: string
        }
        Insert: {
          cover_style?: string
          created_at?: string
          description?: string
          id: string
          is_default?: boolean
          name: string
          org_id: string
          page_size?: string
          preview_image_url?: string | null
          sections?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          cover_style?: string
          created_at?: string
          description?: string
          id?: string
          is_default?: boolean
          name?: string
          org_id?: string
          page_size?: string
          preview_image_url?: string | null
          sections?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
