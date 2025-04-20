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
      tasks: {
        Row: {
          category: Database["public"]["Enums"]["task_category_new"] | null
          completed: boolean | null
          created_at: string | null
          entry: string
          id: string
          name: string
          subcategory: Database["public"]["Enums"]["task_subcategory"] | null
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string | null
          who: string
          due_date: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["task_category_new"] | null
          completed?: boolean | null
          created_at?: string | null
          entry: string
          id?: string
          name: string
          subcategory?: Database["public"]["Enums"]["task_subcategory"] | null
          type: Database["public"]["Enums"]["task_type"]
          updated_at?: string | null
          who?: string
          due_date?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["task_category_new"] | null
          completed?: boolean | null
          created_at?: string | null
          entry?: string
          id?: string
          name?: string
          subcategory?: Database["public"]["Enums"]["task_subcategory"] | null
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string | null
          who?: string
          due_date?: string | null
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
      task_category_new:
        | "My questions"
        | "Questions for me"
        | "My asks"
        | "Asks of me"
        | "Recommendations"
        | "Finds"
        | "Ideas"
        | "Rules / promises"
        | "Task"
        | "Night out"
        | "Date night"
        | "Family day"
      task_subcategory:
        | "House"
        | "Car"
        | "Boat"
        | "Travel"
        | "Books"
        | "Movies"
        | "Shows"
        | "Music"
        | "Eats"
        | "Podcasts"
        | "Activities"
        | "Appearance"
        | "Career / network"
        | "Rules"
        | "Family / friends"
        | "Gifts"
        | "Finances"
        | "Philanthropy"
        | "Side quests"
      task_type: "Focus" | "Follow up" | "Save for later"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      task_category_new: [
        "My questions",
        "Questions for me",
        "My asks",
        "Asks of me",
        "Recommendations",
        "Finds",
        "Ideas",
        "Rules / promises",
        "Task",
        "Night out",
        "Date night",
        "Family day",
      ],
      task_subcategory: [
        "House",
        "Car",
        "Boat",
        "Travel",
        "Books",
        "Movies",
        "Shows",
        "Music",
        "Eats",
        "Podcasts",
        "Activities",
        "Appearance",
        "Career / network",
        "Rules",
        "Family / friends",
        "Gifts",
        "Finances",
        "Philanthropy",
        "Side quests",
      ],
      task_type: ["Focus", "Follow up", "Save for later"],
    },
  },
} as const 