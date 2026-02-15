"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Trophy, Medal, ArrowLeft } from "lucide-react";
import { MobileNav } from "@/app/components/navigation/MobileNav";
import { ProfileEditor } from "@/app/features/profile/components/ProfileEditor";
import { useAuth } from "@/app/components/auth-provider";
import { Button } from "@/app/components/ui/button";

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  total_xp: number;
  current_league: string;
}

export default function LeaderboardPage() {
  const { user, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      if (data) {
        setProfiles(data as any[]);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return <span className="text-xl font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-4 md:p-12 pb-24 md:pb-12">
       <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2 relative">
             <div className="absolute left-0 top-0 hidden md:block">
                <Button variant="ghost" onClick={() => window.location.assign('/')}>
                   <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
             </div>
             <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight pt-2">Global Leaderboard</h1>
             <p className="text-muted-foreground">Top players ranked by Total XP</p>
          </div>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
             <CardHeader>
                <CardTitle>Top Champions</CardTitle>
             </CardHeader>
             <CardContent>
                {loading ? (
                   <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                         <div key={i} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl animate-pulse">
                            <div className="w-8 h-8 bg-zinc-700/50 rounded-full" />
                            <div className="w-10 h-10 bg-zinc-700/50 rounded-full" />
                            <div className="flex-1 h-4 bg-zinc-700/50 rounded" />
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="space-y-2">
                      {profiles.map((profile, index) => (
                          <div 
                             key={profile.id}
                             className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border transition-all hover:bg-muted/50 ${index < 3 ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20' : 'bg-card border-transparent hover:border-border'}`}
                          >
                             <div className="flex items-center justify-center w-8 md:w-10 min-w-[2rem]">
                                {getRankIcon(index)}
                             </div>
                             
                             <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-background shrink-0">
                                {profile.avatar_url ? (
                                   <AvatarImage src={profile.avatar_url} />
                                ) : (
                                   <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                                )}
                             </Avatar>
                             
                             <div className="flex-1 min-w-0">
                                <div className="font-bold text-base md:text-lg flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 truncate">
                                   <span className="truncate">{profile.username || "Anonymous"}</span>
                                   {profile.current_league && (
                                      <span className="text-[10px] md:text-xs px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground w-fit">
                                         {profile.current_league}
                                      </span>
                                   )}
                                </div>
                             </div>
                             
                             <div className="text-right shrink-0">
                                <div className="text-sm md:text-xl font-black text-primary whitespace-nowrap">{profile.total_xp.toLocaleString()} XP</div>
                             </div>
                          </div>
                      ))}
                   </div>
                )}
             </CardContent>
          </Card>
       </div>
      <ProfileEditor user={user} isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} onSignOut={signOut} />
      
      {user && (
         <MobileNav 
            onHome={() => window.location.assign('/')}
            onLeaderboard={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onCreate={() => {
               // Navigation to create state on home might be tricky if not query param based.
               // For now, go home. 
               // Ideally: window.location.assign('/?create=true') or similar.
               window.location.assign('/');
            }}
            onProfile={() => setIsProfileOpen(true)}
            currentView="leaderboard"
         />
      )}
    </div>
  );
}
