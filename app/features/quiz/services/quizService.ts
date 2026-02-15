import { supabase } from "@/app/lib/supabase";
import { Quiz } from "@/app/data/quizzes";
import { Json } from "@/app/types/supabase";
import { logger } from "@/app/lib/logger";

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

    // We return all quizzes here and let the UI handle filtering (e.g. hiding archived ones by default)
    // This allows the user to see their own archived quizzes in a dedicated view
    const visibleQuizzes = data || [];

    return visibleQuizzes.map((q) => {
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
    // Transform Quiz structure to DB structure if necessary, or ensure types align
    const payload = {
      user_id: quiz.user_id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions as unknown as Json[], // Cast to Json[] for Supabase compatibility
      icon: quiz.icon || "✏️",
      color: quiz.color || "from-zinc-500 to-zinc-700",
      creator_email: quiz.creator_email,
      is_public: quiz.is_public,
      subject: quiz.subject
    };

    let data, error;

    if (!isNew && quiz.id) {
       const result = await (supabase as any)
        .from('quizzes')
        .update(payload)
        .eq('id', quiz.id)
        .select()
        .single();
       data = result.data;
       error = result.error;
    } else {
       const result = await (supabase as any)
        .from('quizzes')
        .insert([payload])
        .select()
        .single();
       data = result.data;
       error = result.error;
    }
    
    if (error) throw error;
    return data as unknown as Quiz;
  },

  async archiveQuiz(quizId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('quizzes')
      .update({ is_archived: true })
      .eq('id', quizId);
    if (error) throw error;
  },

  async duplicateQuiz(originalQuizId: string, userId: string): Promise<Quiz> {
    // 1. Fetch original
    const { data: original, error: fetchError } = await (supabase as any)
      .from('quizzes')
      .select('*')
      .eq('id', originalQuizId)
      .single();
    
    if (fetchError || !original) throw fetchError || new Error("Quiz not found");

    // 2. Prepare new payload
    const newQuizPayload = {
      user_id: userId,
      title: `${original.title} (Copy)`,
      description: original.description,
      questions: original.questions,
      icon: original.icon,
      color: original.color,
      subject: original.subject,
      is_public: false, // Default to private for copies
      creator_email: original.creator_email, // Will be updated by trigger usually, but safe to set
      is_archived: false,
      view_count: 0,
      attempt_count: 0
    };

    // 3. Insert
    const { data: newQuiz, error: insertError } = await (supabase as any)
      .from('quizzes')
      .insert([newQuizPayload])
      .select()
      .single();
    
    if (insertError) throw insertError;
    return newQuiz as Quiz;
  },

  async incrementViewCount(quizId: string): Promise<void> {
    // Simple RPC or direct increment if possible. Supabase doesn't support atomic increment directly in JS client easily without RPC.
    // For now, we'll just do a read-modify-write as a best effort, or better: use an RPC if strict accuracy needed.
    // Let's settle for a safe RPC approach if available, otherwise just direct update for MVP.
    // Actually, let's try a direct RPC call since concurrency might be an issue.
    // For now, let's keep it simple: just ignore atomic increments for view counts in MVP or do a quick rpc.
    // We'll use a custom RPC 'increment_quiz_view' if it existed, but since we can't easily add RPCs without SQL,
    // let's stick to a client-side increment for now (imperfect but works for MVP).
    const { error } = await (supabase as any).rpc('increment_view_count', { quiz_id: quizId });
    if (error) {
       // Fallback or just log
       console.warn("Failed to increment view count", error);
    }
  },

  async submitAttempt(
    quizId: string, 
    title: string, 
    score: number, 
    total: number, 
    answers: Json[],
    quizSnapshot?: any // New: Optional snapshot of the quiz state
  ): Promise<{ 
    xp_gained: number; 
    xp_from_attempt: number;
    previous_best_xp: number;
    new_total_xp: number;
    new_league: string;
    is_new_best: boolean;
  } | null> {
    const rpcResponse = await (supabase as any).rpc('submit_quiz_attempt', {
      p_quiz_id: quizId,
      p_quiz_title: title,
      p_score: score, 
      p_total_questions: total,
      p_answers: answers
    });
    
    const { data, error } = rpcResponse as any;
    
    if (error) {
       logger.error("Supabase RPC Error in submitAttempt", error, { quizId, title });
       throw error;
    }

    if (data && data.attempt_id && quizSnapshot) {
       // Step 2: Save snapshot and increment attempt count
       await (supabase as any).from('quiz_attempts').update({
          quiz_snapshot: quizSnapshot
       }).eq('id', data.attempt_id);

       // Increment attempt count on quiz
       await (supabase as any).rpc('increment_attempt_count', { quiz_id: quizId });
    }

    if (data) {
       return data;
    }
    return null;
  },
  
  async deleteQuiz(quizId: string): Promise<void> { // We keep hard delete for specifically requested "Delete Permanently"
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

  async getUserAttemptHistory(userId: string): Promise<{ 
    id: string; 
    quiz_id: string; 
    quiz_title: string; 
    score: number; 
    total_questions: number; 
    completed_at: string 
  }[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('id, quiz_id, quiz_title, score, total_questions, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async clearHistory(): Promise<void> {
    const { error } = await supabase.rpc('clear_user_history');
    if (error) throw error;
  }
};


