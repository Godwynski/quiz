import { Play, Edit2, Trash2, User, Copy, Archive, Eye, PlayCircle, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator
} from "@/app/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Quiz } from "@/app/data/quizzes";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Image from "next/image";

export interface QuizCardProps {
  quiz: Quiz;
  user: SupabaseUser | null;
  isCustom: boolean;
  userStatus?: 'perfect' | 'completed' | 'none';
  onStart: (id: string) => void;
  onEdit?: (e: React.MouseEvent, quiz: Quiz) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
  onDuplicate?: (e: React.MouseEvent, quiz: Quiz) => void;
  onArchive?: (e: React.MouseEvent, id: string) => void;
}

export function QuizCard({ quiz, user, isCustom, userStatus, onStart, onEdit, onDelete, onDuplicate, onArchive }: QuizCardProps) {
  const isOwner = user?.email === quiz.creator_email || user?.id === quiz.user_id;

  return (
    <Card 
      role="button"
      tabIndex={0}
      onClick={() => onStart(quiz.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onStart(quiz.id);
        }
      }}
      className="cursor-pointer group relative overflow-hidden transition-all hover:scale-[1.01] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 bg-white hover:bg-[#fff9f0] focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none rounded-xl"
    >
      <div className={`absolute top-0 left-0 w-full h-1.5`} style={{ backgroundColor: quiz.color || '#000' }} />
      
      {/* Status Badge */}
      {userStatus && userStatus !== 'none' && (
         <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-md border border-black text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] z-10 ${userStatus === 'perfect' ? 'bg-yellow-300 text-yellow-900' : 'bg-green-300 text-green-900'}`}>
            {userStatus === 'perfect' ? 'Perfect' : 'Done'}
         </div>
      )}

      <CardHeader className="pt-6 pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="p-2.5 rounded-lg border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white group-hover:rotate-3 transition-transform text-xl">
            {quiz.icon || '📝'}
          </div>
          {isCustom && isOwner && (
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-black/5 hover:text-black rounded-full transition-all"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => onEdit?.(e, quiz)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => onDuplicate?.(e, quiz)}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Duplicate</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => onArchive?.(e, quiz.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    <span>Archive</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => onDelete?.(e, quiz.id)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <CardTitle className="text-lg font-bold mt-3 line-clamp-1">{quiz.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs font-medium text-muted-foreground mt-1">{quiz.description}</CardDescription>
      </CardHeader>
      
      <CardFooter className="pt-0 flex flex-col gap-2 text-xs text-muted-foreground font-medium pb-4">
        <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-dashed border-muted-foreground/30 bg-muted/30">
            <span>{Array.isArray(quiz.questions) ? quiz.questions.length : 0} Qs</span>
            </div>
            <Button size="icon" className="rounded-full h-8 w-8 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black text-white hover:bg-primary hover:text-primary-foreground transition-all group-hover:rotate-6">
            <Play className="h-3.5 w-3.5 fill-current" />
            </Button>
        </div>
        
        {/* Stats Row */}
        <div className="flex w-full items-center justify-start gap-3 mt-0.5 pl-1 opacity-60">
           <div className="flex items-center gap-1" title="Views">
              <Eye className="w-3 h-3" />
              <span>{quiz.view_count || 0}</span>
           </div>
           <div className="flex items-center gap-1" title="Attempts">
              <PlayCircle className="w-3 h-3" />
              <span>{quiz.attempt_count || 0}</span>
           </div>
        </div>
      </CardFooter>
      
      {/* Footer with Creator Info */}
      <div className="px-6 py-2 mt-auto border-t border-dashed border-muted-foreground/20 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-2">
          <div className="relative h-5 w-5 rounded-full overflow-hidden border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
             {quiz.creator_avatar_url ? (
               <Image src={quiz.creator_avatar_url} alt="Avatar" fill className="object-cover" />
             ) : (
               <div className="h-full w-full bg-muted flex items-center justify-center">
                 <User className="h-2.5 w-2.5" />
               </div>
             )}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px]">
            {quiz.creator_username || quiz.creator_email?.split('@')[0] || 'Unknown'}
          </span>
        </div>
      </div>
    </Card>
  );
}
