import useSWR from 'swr';
import { quizService } from '@/app/features/quiz/services/quizService';

interface UserAttemptStats {
  best_score: number;
  total: number;
  is_perfect: boolean;
}

export function useUserAttempts(userId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR(
    userId ? `user-attempts-${userId}` : null,
    async () => {
      if (!userId) return {};
      const attempts = await quizService.getUserAttempts(userId);
      
      const attemptsMap: Record<string, UserAttemptStats> = {};
            
      attempts.forEach(attempt => {
          const existing = attemptsMap[attempt.quiz_id];
          const isPerfect = attempt.score === attempt.total_questions;
          
          if (!existing || attempt.score > existing.best_score) {
            attemptsMap[attempt.quiz_id] = {
                best_score: attempt.score,
                total: attempt.total_questions,
                is_perfect: isPerfect || (existing?.is_perfect ?? false)
            };
          } else if (isPerfect) {
            existing.is_perfect = true;
          }
      });
      return attemptsMap;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    userAttempts: data || {},
    loading: isLoading,
    error,
    mutate,
  };
}
