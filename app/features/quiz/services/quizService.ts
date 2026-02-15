import { supabase } from "@/app/lib/supabase";
import { Quiz } from "@/app/data/quizzes";
import { Json } from "@/app/types/supabase";

export const quizService = {
  async getQuizzes(): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((q) => {
      const profile = (q as { profiles?: { username?: string; avatar_url?: string } }).profiles;
      const quiz: Quiz = {
        ...(q as Quiz),
        creator_username: profile?.username || undefined,
        creator_avatar_url: profile?.avatar_url || undefined,
      };
      
      // Clean up the profiles property for the strict Quiz type
      if ('profiles' in quiz) delete (quiz as Record<string, unknown>).profiles;
      
      return quiz;
    });
  },

  async saveQuiz(quiz: Partial<Quiz> & { user_id: string }, isNew: boolean): Promise<Quiz> {
    const payload = {
      user_id: quiz.user_id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
      icon: quiz.icon || "✏️",
      color: quiz.color || "from-zinc-500 to-zinc-700",
      creator_email: quiz.creator_email,
      is_public: quiz.is_public,
      subject: quiz.subject
    };

    const query = !isNew && quiz.id
      ? supabase.from('quizzes').update(payload as unknown as never).eq('id', quiz.id)
      : supabase.from('quizzes').insert([payload] as unknown as never[]);

    const { data, error } = await query.select().single();
    
    if (error) throw error;
    return data as Quiz;
  },

  async submitAttempt(quizId: string, title: string, score: number, total: number, answers: Json[]): Promise<{ xp_gained: number; new_league: string } | null> {
    const { data, error } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: quizId,
      p_quiz_title: title,
      p_score: score, 
      p_total_questions: total,
      p_answers: answers as unknown as Json
    } as unknown as undefined);
    
    if (error) {
       console.error("Supabase RPC Error:", error);
       throw error;
    }

    if (data) {
       return data as { xp_gained: number; new_league: string };
    }
    return null;
  },
  async deleteQuiz(quizId: string): Promise<void> {
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) throw error;
  },

  async getUserAttempts(userId: string): Promise<{ quiz_id: string; score: number; total_questions: number }[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, score, total_questions')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async clearHistory(): Promise<void> {
    const { error } = await supabase.rpc('clear_user_history');
    if (error) throw error;
  }
};


