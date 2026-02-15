import { Quiz } from "@/app/data/quizzes";
import { User } from "@supabase/supabase-js";
import { QuizCard } from "./QuizCard";
import { QuizListCard } from "./QuizListCard";
import { Search, LayoutGrid, List } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredQuizzes = Object.values(quizzes).filter(quiz => {
    const isOwner = user && (quiz.user_id === user.id || quiz.creator_email === user.email);

    // 1. Visibility Check: Hide private quizzes from non-owners
    if (!quiz.is_public && !isOwner) {
      return false;
    }

    // 2. Filter by Tab (My Quizzes)
    if (filter === 'my' && !isOwner) {
      return false;
    }

    // 3. Filter by Search
    if (search && !quiz.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[200px] w-full animate-pulse rounded-xl bg-muted/50 border-2 border-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
         {/* Search Bar */}
         <div className="relative w-full sm:max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Search quizzes..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-9 h-11 border-2 border-black/10 shadow-sm focus-visible:border-black/30 rounded-xl bg-white"
           />
         </div>

         <div className="flex gap-2">
            {/* Filter Tabs - Segmented Control Style */}
            <div className="flex p-1 bg-muted/80 rounded-xl border border-black/5 flex-1 sm:flex-none">
               <Button 
                 variant="ghost"
                 onClick={() => setFilter('all')}
                 className={`flex-1 sm:flex-none h-9 rounded-lg text-sm font-semibold transition-all ${filter === 'all' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 All
               </Button>
               <Button 
                 variant="ghost"
                 onClick={() => setFilter('my')}
                 disabled={!user}
                 className={`flex-1 sm:flex-none h-9 rounded-lg text-sm font-semibold transition-all ${filter === 'my' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
               >
                 My Quizzes
               </Button>
            </div>

            {/* View Toggle */}
            <div className="flex p-1 bg-muted/80 rounded-xl border border-black/5 shrink-0">
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
               >
                  <LayoutGrid className="h-4 w-4" />
               </Button>
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
               >
                  <List className="h-4 w-4" />
               </Button>
            </div>
         </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-20 bg-[#fff9f0] rounded-xl border-4 border-black border-dashed">
          <p className="text-2xl font-bold text-muted-foreground">No quizzes found 🕵️‍♂️</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or create a new one!</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
          {filteredQuizzes.map((quiz) => (
             viewMode === 'grid' ? (
                <QuizCard 
                  key={quiz.id} 
                  quiz={quiz} 
                  user={user} 
                  isCustom={true}
                  onStart={onStart} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                />
             ) : (
                <QuizListCard 
                  key={quiz.id} 
                  quiz={quiz} 
                  user={user} 
                  isCustom={true}
                  onStart={onStart} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                />
             )
          ))}
        </div>
      )}
    </div>
  );
}
