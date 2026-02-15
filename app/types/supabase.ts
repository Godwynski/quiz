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
          questions: Json
          creator_email: string | null
          subject: string | null
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
          questions: Json
          creator_email?: string | null
          subject?: string | null
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
          questions?: Json
          creator_email?: string | null
          subject?: string | null
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
          new_total_xp: number
          new_league: string
        }
      }
    }
  }
}
