import useSWR from 'swr';
import { quizService } from '@/app/features/quiz/services/quizService';

export interface AttemptHistoryItem {
  id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export function useAttemptHistory(userId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR<AttemptHistoryItem[]>(
    userId ? `user-history-${userId}` : null,
    async () => {
      if (!userId) return [];
      return await quizService.getUserAttemptHistory(userId);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    history: data || [],
    loading: isLoading,
    error,
    mutate,
  };
}
