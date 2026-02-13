import { Quiz, quizzes as staticQuizzes } from "@/app/data/quizzes";
import { QuizCard } from "./QuizCard";
import { Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface QuizGridProps {
  quizzes: Record<string, Quiz>;
  loading: boolean;
  user: User | null;
  onStart: (id: string) => void;
  onEdit: (e: React.MouseEvent, quiz: Quiz) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function QuizGrid({ quizzes, loading, user, onStart, onEdit, onDelete }: QuizGridProps) {
  if (loading) {
     return (
        <div className="flex justify-center py-20">
           <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
     );
  }

  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.values(quizzes)
        .filter(quiz => {
          // If it's a hardcoded manual quiz (no user_id), always show (or treat as public)
          // If it's a supabase quiz, show if public OR user is owner
          const isOwner = user && quiz.creator_email === user.email; // Fallback to email if user_id missing, but best if checking ID
          return quiz.is_public || isOwner || !quiz.creator_email; 
        })
        .map((quiz) => {
           const isCustom = !staticQuizzes[quiz.id]; // Hardcoded logic
           return (
             <QuizCard 
               key={quiz.id}
               quiz={quiz}
               user={user}
               isCustom={isCustom}
               onStart={onStart}
               onEdit={onEdit}
               onDelete={onDelete}
             />
           );
        })}
     </div>
  );
}
