import { Play, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { QuizCardProps } from "./QuizCard";

export function QuizListCard({ quiz, user, isCustom, onStart, onEdit, onDelete }: QuizCardProps) {
  const isOwner = user?.email === quiz.creator_email || user?.id === quiz.user_id;

  return (
    <Card 
      onClick={() => onStart(quiz.id)}
      className="cursor-pointer group flex items-center p-2 gap-3 border border-black/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all bg-white hover:bg-zinc-50 rounded-lg"
    >
      {/* Icon Area */}
      <div 
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md border border-black/10 bg-white text-lg shadow-sm"
        style={{ backgroundColor: quiz.color ? `${quiz.color}15` : '#f4f4f5' }}
      >
        {quiz.icon || '📝'}
      </div>

      {/* Content Area */}
      <div className="flex-grow min-w-0 flex flex-col justify-center">
        <h3 className="font-semibold text-sm truncate leading-tight text-foreground">{quiz.title}</h3>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
           {quiz.questions?.length ?? 0} Qs • {quiz.creator_username || 'Unknown'}
        </p>
      </div>

      {/* Actions Area */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
         {/* Edit/Delete Actions */}
         {isCustom && isOwner && (
            <>
               <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => onEdit?.(e, quiz)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
               >
                  <Edit2 className="w-3.5 h-3.5" />
               </Button>
               <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => onDelete?.(e, quiz.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-red-600"
               >
                  <Trash2 className="w-3.5 h-3.5" />
               </Button>
            </>
         )}

         <Button 
            size="icon" 
            className="rounded-full h-7 w-7 bg-black text-white hover:bg-primary shadow-sm hover:shadow transition-all shrink-0 ml-1"
         >
            <Play className="h-3 w-3 fill-current" />
         </Button>
      </div>
    </Card>
  );
}
