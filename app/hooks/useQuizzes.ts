import useSWR from 'swr';
import { quizService } from '@/app/features/quiz/services/quizService';
import { Quiz } from '@/app/data/quizzes';

const EMPTY_QUIZZES: Quiz[] = [];

export function useQuizzes() {
  const { data, error, mutate, isLoading } = useSWR<Quiz[]>('quizzes', quizService.getQuizzes, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    quizzes: data || EMPTY_QUIZZES,
    loading: isLoading,
    error,
    mutate,
  };
}
