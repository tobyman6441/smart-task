export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          entry: string
          name: string
          type: Database["public"]["Enums"]["task_type"]
          category: Database["public"]["Enums"]["task_category"]
          subcategory: Database["public"]["Enums"]["task_subcategory"] | null
          who: string
          completed: boolean
          due_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          entry: string
          name: string
          type: Database["public"]["Enums"]["task_type"]
          category: Database["public"]["Enums"]["task_category"]
          subcategory?: Database["public"]["Enums"]["task_subcategory"] | null
          who?: string
          completed?: boolean
          due_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          entry?: string
          name?: string
          type?: Database["public"]["Enums"]["task_type"]
          category?: Database["public"]["Enums"]["task_category"]
          subcategory?: Database["public"]["Enums"]["task_subcategory"] | null
          who?: string
          completed?: boolean
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
      task_type: "Focus" | "Follow up" | "Save for later"
      task_category: "My questions" | "Questions for me" | "My asks" | "Asks of me" | "Recommendations" | "Finds" | "Ideas" | "Rules / promises" | "Task" | "Night out" | "Date night" | "Family day"
      task_subcategory: "House" | "Car" | "Boat" | "Travel" | "Books" | "Movies" | "Shows" | "Music" | "Eats" | "Podcasts" | "Activities" | "Appearance" | "Career / network" | "Rules" | "Family / friends" | "Gifts" | "Finances" | "Philanthropy" | "Side quests"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 