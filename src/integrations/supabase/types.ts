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
      alerts: {
        Row: {
          acknowledged: boolean
          created_at: string
          device_id: string
          id: number
          message: string
          metadata: Json | null
          severity: string
          type: string
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          device_id: string
          id?: number
          message: string
          metadata?: Json | null
          severity?: string
          type: string
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          device_id?: string
          id?: number
          message?: string
          metadata?: Json | null
          severity?: string
          type?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string
          description: string | null
          device_id: string
          device_key: string
          id: string
          last_seen: string | null
          location: string | null
          name: string
          online: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          device_id: string
          device_key: string
          id?: string
          last_seen?: string | null
          location?: string | null
          name: string
          online?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          device_id?: string
          device_key?: string
          id?: string
          last_seen?: string | null
          location?: string | null
          name?: string
          online?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          created_at: string
          device_id: string
          id: number
          level: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: number
          level?: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: number
          level?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      telemetry: {
        Row: {
          buttons: Json | null
          created_at: string
          device_id: string
          energy: boolean | null
          generator: boolean | null
          humidity: number | null
          id: number
          ip: string | null
          leds: Json | null
          mac: string | null
          raw: Json | null
          rssi: number | null
          status: string | null
          temperature: number | null
          uptime: number | null
          wifi: string | null
        }
        Insert: {
          buttons?: Json | null
          created_at?: string
          device_id: string
          energy?: boolean | null
          generator?: boolean | null
          humidity?: number | null
          id?: number
          ip?: string | null
          leds?: Json | null
          mac?: string | null
          raw?: Json | null
          rssi?: number | null
          status?: string | null
          temperature?: number | null
          uptime?: number | null
          wifi?: string | null
        }
        Update: {
          buttons?: Json | null
          created_at?: string
          device_id?: string
          energy?: boolean | null
          generator?: boolean | null
          humidity?: number | null
          id?: number
          ip?: string | null
          leds?: Json | null
          mac?: string | null
          raw?: Json | null
          rssi?: number | null
          status?: string | null
          temperature?: number | null
          uptime?: number | null
          wifi?: string | null
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          purpose: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          purpose: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          used?: boolean
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
