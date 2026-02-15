import { Quiz } from "@/app/data/quizzes";
import { User } from "@supabase/supabase-js";
import { QuizCard } from "./QuizCard"; // Same directory import
import { Search } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { useState } from "react";

interface QuizGridProps {
  quizzes: Record<string, Quiz>;
  loading: boolean;
  user: User | null;
  onStart: (id: string) => void;
  onEdit: (e: React.MouseEvent, quiz: Quiz) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function QuizGrid({ quizzes, loading, user, onStart, onEdit, onDelete }: QuizGridProps) {
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [search, setSearch] = useState('');

  const filteredQuizzes = Object.values(quizzes).filter(quiz => {
    // Filter by ownership
    if (filter === 'my' && (!user || (quiz.creator_email !== user.email && quiz.user_id !== user.id))) {
      return false;
    }
    // Filter by search
    if (search && !quiz.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50 border-4 border-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
         <div className="relative w-full sm:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Search quizzes..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-9 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl"
           />
         </div>
         <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none border-2 border-black rounded-xl font-bold ${filter === 'all' ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'shadow-none hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] hover:translate-y-0'}`}
            >
              All Quizzes
            </Button>
            <Button 
              variant={filter === 'my' ? 'default' : 'outline'}
              onClick={() => setFilter('my')}
              disabled={!user}
              className={`flex-1 sm:flex-none border-2 border-black rounded-xl font-bold ${filter === 'my' ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'shadow-none hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] hover:translate-y-0'}`}
            >
              My Quizzes
            </Button>
         </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-[#fff9f0] rounded-xl border-4 border-black border-dashed">
          <p className="text-2xl font-bold text-muted-foreground">No quizzes found 🕵️‍♂️</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or create a new one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
             <QuizCard 
               key={quiz.id} 
               quiz={quiz} 
               user={user} 
               isCustom={true}
               onStart={onStart} 
               onEdit={onEdit} 
               onDelete={onDelete} 
             />
          ))}
        </div>
      )}
    </div>
  );
}
