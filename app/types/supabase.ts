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
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          total_xp: number
          current_league: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          total_xp?: number
          current_league?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          total_xp?: number
          current_league?: string
          updated_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          description: string | null
          icon: string | null
          color: string | null
          is_public: boolean
          questions: Json[]
          creator_email: string | null
          subject: string | null
          is_archived: boolean
          view_count: number
          attempt_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_public?: boolean
          questions: Json[]
          creator_email?: string | null
          subject?: string | null
          is_archived?: boolean
          view_count?: number
          attempt_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_public?: boolean
          questions?: Json[]
          creator_email?: string | null
          subject?: string | null
          is_archived?: boolean
          view_count?: number
          attempt_count?: number
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          quiz_title: string
          score: number
          total_questions: number
          completed_at: string
          answers: Json
          quiz_snapshot: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          quiz_title: string
          score: number
          total_questions: number
          completed_at?: string
          answers: Json
          quiz_snapshot?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          quiz_title?: string
          score?: number
          total_questions?: number
          completed_at?: string
          answers?: Json
          quiz_snapshot?: Json | null
        }
      }
    }
    Functions: {
      submit_quiz_attempt: {
        Args: {
          p_quiz_id: string
          p_quiz_title: string
          p_score: number
          p_total_questions: number
          p_answers: Json
        }
        Returns: {
          attempt_id: string
          xp_gained: number
          xp_from_attempt: number
          previous_best_xp: number
          new_total_xp: number
          new_league: string
          is_new_best: boolean
        }
      }
      clear_user_history: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      increment_view_count: {
        Args: {
          quiz_id: string
        }
        Returns: void
      }
      increment_attempt_count: {
        Args: {
          quiz_id: string
        }
        Returns: void
      }
    }
  }
}
