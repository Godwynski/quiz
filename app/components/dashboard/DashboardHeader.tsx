import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface DashboardHeaderProps {
  user: User | null;
  onSignOut: () => void;
  onCreateQuiz: () => void;
}

export function DashboardHeader({ user, onSignOut, onCreateQuiz }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image src="/logo.svg" alt="QuizMaster Logo" fill className="object-contain" priority />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Quizmaster</h1>
        </div>
        <p className="text-muted-foreground max-w-sm">
          {user ? `Welcome back, ${user.email}` : "Explore and play quizzes below."}
        </p>
      </div>
      <div className="flex gap-4">
        {user ? (
          <Button onClick={onSignOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        ) : (
          <Button onClick={() => window.location.assign('/login')} variant="outline">
            Sign In
          </Button>
        )}
        <Button 
          onClick={() => {
            if (!user) {
              toast.error("Please login to create quizzes"); 
              return;
            }
            onCreateQuiz();
          }}
          className="rounded-full h-11 px-6 font-medium"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </div>
    </header>
  );
}
