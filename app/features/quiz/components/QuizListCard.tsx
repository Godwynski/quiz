import { Play, Edit2, Trash2, Copy, Archive, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator
} from "@/app/components/ui/dropdown-menu";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { QuizCardProps } from "./QuizCard";

export function QuizListCard({ quiz, user, isCustom, userStatus, onStart, onEdit, onDelete, onDuplicate, onArchive }: QuizCardProps) {
  const isOwner = user?.email === quiz.creator_email || user?.id === quiz.user_id;

  return (
    <Card 
      onClick={() => onStart(quiz.id)}
      className="cursor-pointer group flex items-center p-2 gap-3 border border-black/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:border-black hover:-translate-y-0.5 transition-all bg-white hover:bg-[#fff9f0] rounded-lg"
    >
      {/* Icon Area */}
      <div 
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md border border-black/10 bg-white text-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,0.05)] group-hover:border-black group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        style={{ backgroundColor: quiz.color ? `${quiz.color}15` : '#f4f4f5' }}
      >
        {quiz.icon || '📝'}
      </div>

      {/* Content Area */}
      <div className="flex-grow min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2">
           <h3 className="font-semibold text-sm truncate leading-tight text-foreground">{quiz.title}</h3>
           {userStatus && userStatus !== 'none' && (
               <span className={`text-[9px] px-1.5 py-0.5 rounded border border-black/10 font-bold uppercase ${userStatus === 'perfect' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {userStatus === 'perfect' ? 'Perfect' : 'Done'}
               </span>
           )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
           {quiz.questions?.length ?? 0} Qs • {quiz.creator_username || 'Unknown'}
        </p>
      </div>

      {/* Actions Area */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
         {/* Edit/Delete Actions */}
         {isCustom && isOwner && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:bg-black/5 hover:text-black rounded-full transition-all"
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

         <Button 
            size="icon" 
            className="rounded-full h-7 w-7 bg-black text-white hover:bg-primary shadow-sm hover:shadow-md transition-all shrink-0 ml-1"
         >
            <Play className="h-3 w-3 fill-current" />
         </Button>
      </div>
    </Card>
  );
}
