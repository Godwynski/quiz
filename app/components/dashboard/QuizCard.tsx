import { Quiz } from "@/app/data/quizzes";
import { Button } from "@/app/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Edit2, Trash2, Globe, Lock, BookOpen, ArrowRight } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface QuizCardProps {
  quiz: Quiz;
  user: User | null;
  isCustom: boolean;
  onStart: (id: string) => void;
  onEdit: (e: React.MouseEvent, quiz: Quiz) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function QuizCard({ quiz, user, isCustom, onStart, onEdit, onDelete }: QuizCardProps) {
  return (
    <Card 
      className="group relative overflow-hidden border-border bg-card transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={() => onStart(quiz.id)}
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${quiz.color?.replace('from-', 'from-').replace('to-', 'to-') || 'from-zinc-500 to-zinc-700'} opacity-80`} />
      
      <CardHeader className="pb-4 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            <div className="p-3 bg-muted rounded-xl text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm relative">
              {quiz.icon || "📝"}
              {user && (
                <div 
                  className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-sm border border-border" 
                  title={quiz.is_public ? "Public Quiz" : "Private Quiz"}
                >
                  {quiz.is_public ? (
                    <Globe className="w-3 h-3 text-zinc-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              )}
            </div>
          </div>
          {isCustom && user?.email === quiz.creator_email && (
            <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => onEdit(e, quiz)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => onDelete(e, quiz.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <CardTitle className="text-xl font-semibold leading-tight mb-2">
          {quiz.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {quiz.description}
        </CardDescription>
      </CardHeader>
      
      <CardFooter className="pt-0 mt-auto border-t border-border/50 p-4 bg-muted/20">
        <div className="flex items-center text-xs font-medium text-muted-foreground">
          <BookOpen className="mr-2 h-3.5 w-3.5" />
          {quiz.questions.length} Questions
        </div>
        {quiz.creator_email && (
          <div className="ml-4 flex items-center text-[10px] text-muted-foreground italic truncate max-w-[120px]">
            by {quiz.creator_email.split('@')[0]}
          </div>
        )}
        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </CardFooter>
    </Card>
  );
}
