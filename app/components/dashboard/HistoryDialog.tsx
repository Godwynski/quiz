import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { History, Clock, FileText, Trophy } from "lucide-react"; // Icons
import { supabase } from "@/app/lib/supabase";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface HistoryDialogProps {
  user: User | null;
}

interface QuizAttempt {
  id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export function HistoryDialog({ user }: HistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_title, score, total_questions, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50); // Fetch last 50 attempts

    if (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history.");
    } else {
      setAttempts(data || []);
    }
    setLoading(false);
  }, [user]);

  // Data fetching when dialog opens is a legitimate use case
  useEffect(() => {
    if (open && user) {
      fetchHistory(); // eslint-disable-line
    }
  }, [open, user, fetchHistory]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <History className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Attempts History
          </DialogTitle>
          <DialogDescription>
            Your recent quiz results and scores.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {loading ? (
             <div className="flex justify-center items-center h-full text-muted-foreground">
                Loading history...
             </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-muted-foreground py-10">
              <Clock className="w-10 h-10 opacity-20" />
              <p>No attempts recorded yet.</p>
              <p className="text-xs">Complete a quiz to see it here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-medium leading-none flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      {attempt.quiz_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border ${
                    attempt.score === attempt.total_questions 
                      ? "bg-green-100 text-green-700 border-green-200" 
                      : "bg-secondary text-secondary-foreground border-border"
                  }`}>
                    {attempt.score === attempt.total_questions && <Trophy className="w-3 h-3" />}
                    {attempt.score} / {attempt.total_questions}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
