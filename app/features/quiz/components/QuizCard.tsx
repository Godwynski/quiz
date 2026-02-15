import { Play, Edit2, Trash2, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Quiz } from "@/app/data/quizzes";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Image from "next/image";

export interface QuizCardProps {
  quiz: Quiz;
  user: SupabaseUser | null;
  isCustom: boolean;
  onStart: (id: string) => void;
  onEdit?: (e: React.MouseEvent, quiz: Quiz) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
}

export function QuizCard({ quiz, user, isCustom, onStart, onEdit, onDelete }: QuizCardProps) {
  const isOwner = user?.email === quiz.creator_email || user?.id === quiz.user_id;

  return (
    <Card 
      onClick={() => onStart(quiz.id)}
      className="cursor-pointer group relative overflow-hidden transition-all hover:scale-[1.02] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 bg-white hover:bg-[#fff9f0]"
    >
      <div className={`absolute top-0 left-0 w-full h-2`} style={{ backgroundColor: quiz.color || '#000' }} />
      
      <CardHeader className="pt-8 pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="p-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white group-hover:rotate-6 transition-transform text-2xl">
            {quiz.icon || '📝'}
          </div>
          {isCustom && isOwner && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => onEdit?.(e, quiz)}
                className="h-8 w-8 hover:bg-black hover:text-white rounded-lg border-2 border-transparent hover:border-black transition-all"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => onDelete?.(e, quiz.id)}
                className="h-8 w-8 hover:bg-red-500 hover:text-white rounded-lg border-2 border-transparent hover:border-black transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <CardTitle className="text-xl font-black mt-4 line-clamp-1">{quiz.title}</CardTitle>
        <CardDescription className="line-clamp-2 font-medium text-muted-foreground">{quiz.description}</CardDescription>
      </CardHeader>
      
      <CardFooter className="pt-0 flex items-center justify-between text-sm font-bold text-muted-foreground">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/30">
          <span>{Array.isArray(quiz.questions) ? quiz.questions.length : 0} Questions</span>
        </div>
        <Button size="icon" className="rounded-full h-10 w-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black text-white hover:bg-primary hover:text-primary-foreground transition-all group-hover:rotate-12">
          <Play className="h-4 w-4 fill-current" />
        </Button>
      </CardFooter>
      
      {/* Footer with Creator Info */}
      <div className="px-6 pb-4 pt-0 mt-auto border-t border-dashed border-muted-foreground/20 flex items-center justify-between">
        <div className="flex items-center gap-2 mt-3">
          <div className="relative h-6 w-6 rounded-full overflow-hidden border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
             {quiz.creator_avatar_url ? (
               <Image src={quiz.creator_avatar_url} alt="Avatar" fill className="object-cover" />
             ) : (
               <div className="h-full w-full bg-muted flex items-center justify-center">
                 <User className="h-3 w-3" />
               </div>
             )}
          </div>
          <span className="text-xs font-bold text-muted-foreground truncate max-w-[120px]">
            {quiz.creator_username || quiz.creator_email?.split('@')[0] || 'Unknown'}
          </span>
        </div>
      </div>
    </Card>
  );
}
