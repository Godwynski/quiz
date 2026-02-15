"use client";

import { Home, Trophy, PlusCircle, User } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface MobileNavProps {
  onHome: () => void;
  onLeaderboard: () => void;
  onCreate: () => void;
  onProfile: () => void;
  currentView: 'home' | 'leaderboard'; // concise way to highlight active tab if needed
}

export function MobileNav({ onHome, onLeaderboard, onCreate, onProfile, currentView }: MobileNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border md:hidden pb-safe">
      <div className="flex items-center justify-around p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn("flex flex-col gap-1 h-auto py-2", currentView === 'home' && "text-primary")}
          onClick={onHome}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col gap-1 h-auto py-2"
          onClick={onLeaderboard}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-medium">Leaders</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col gap-1 h-auto py-2 text-primary"
          onClick={onCreate}
        >
          <PlusCircle className="w-6 h-6 fill-primary/10" />
          <span className="text-[10px] font-medium">Create</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col gap-1 h-auto py-2"
          onClick={onProfile}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </Button>
      </div>
    </div>
  );
}
