export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  questions: Question[];
  creator_email?: string;
  creator_name?: string;
}

// Default data removed per user request. 
// Now strictly using Supabase data.
export const quizzes: Record<string, Quiz> = {};
