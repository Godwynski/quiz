"use client";

import Image from "next/image";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { supabase } from "@/app/lib/supabase";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { User as UserIcon } from "lucide-react";

interface ProfileEditorProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}

export function ProfileEditor({ user, isOpen, onOpenChange, onSignOut }: ProfileEditorProps) {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [totalXp, setTotalXp] = useState(0);
  const [league, setLeague] = useState("Bronze");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url, total_xp, current_league')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) throw error;
          if (data) {
            const profile = data as { username?: string; avatar_url?: string; total_xp?: number; current_league?: string };
            setUsername(profile.username || "");
            setAvatarUrl(profile.avatar_url || "");
            setTotalXp(profile.total_xp || 0);
            setLeague(profile.current_league || "Bronze");
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      fetchProfile();
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
          total_xp: 0,
          current_league: 'Bronze'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as any, { onConflict: 'id' });

      if (error) throw error;
      toast.success("Profile updated!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] sm:w-full sm:max-w-[425px] border-4 border-black doodle-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#fff9f0]">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black tracking-wide text-center uppercase transform -rotate-2">
            Player Card
          </DialogTitle>
          <DialogDescription className="text-center font-medium text-muted-foreground">
            View your stats and update your profile details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
             <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center bg-white group cursor-pointer"
                  onClick={() => document.getElementById('avatar-upload')?.click()}>
                {avatarUrl ? (
                   <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                   <UserIcon className="h-12 w-12 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-white font-bold text-xs uppercase">Upload</span>
                </div>
             </div>
             <input 
               type="file" 
               id="avatar-upload" 
               className="hidden" 
               accept="image/*"
               onChange={async (e) => {
                 const file = e.target.files?.[0];
                 if (!file) return;

                 // Resize logic
                 const resizeImage = (file: File): Promise<Blob> => {
                   return new Promise((resolve, reject) => {
                     const img = document.createElement('img');
                     img.src = URL.createObjectURL(file);
                     img.onload = () => {
                       const canvas = document.createElement('canvas');
                       const MAX_WIDTH = 300;
                       const MAX_HEIGHT = 300;
                       let width = img.width;
                       let height = img.height;

                       if (width > height) {
                         if (width > MAX_WIDTH) {
                           height *= MAX_WIDTH / width;
                           width = MAX_WIDTH;
                         }
                       } else {
                         if (height > MAX_HEIGHT) {
                           width *= MAX_HEIGHT / height;
                           height = MAX_HEIGHT;
                         }
                       }

                       canvas.width = width;
                       canvas.height = height;
                       const ctx = canvas.getContext('2d');
                       ctx?.drawImage(img, 0, 0, width, height);
                       
                       canvas.toBlob((blob) => {
                         if (blob) resolve(blob);
                         else reject(new Error('Canvas to Blob failed'));
                       }, 'image/jpeg', 0.7); // Quality 0.7 for small size
                     };
                     img.onerror = reject;
                   });
                 };

                 try {
                   setLoading(true);
                   const resizedBlob = await resizeImage(file);
                   const fileExt = 'jpg';
                   const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
                   const filePath = `${fileName}`;

                   console.log('Uploading...', filePath);

                   const { error: uploadError } = await supabase.storage
                     .from('avatars')
                     .upload(filePath, resizedBlob, {
                       contentType: 'image/jpeg',
                       upsert: true
                     });

                   if (uploadError) throw uploadError;

                   const { data: { publicUrl } } = supabase.storage
                     .from('avatars')
                     .getPublicUrl(filePath);

                   setAvatarUrl(publicUrl);
                   toast.success("Avatar uploaded!");
                 } catch (error: unknown) {
                    console.error('Upload Error:', error);
                    toast.error(error instanceof Error ? error.message : "Failed to upload avatar");
                 } finally {
                   setLoading(false);
                 }
               }}
             />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 transition-transform hover:rotate-0">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total XP</span>
              <span className="text-2xl font-black text-black">{totalXp.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1 transition-transform hover:rotate-0">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">League</span>
              <span className="text-2xl font-black text-amber-600">{league}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-bold ml-1">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:border-black focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-none transition-all"
                placeholder="CoolQuizzer123"
              />
            </div>

          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button 
            variant="destructive" 
            onClick={onSignOut} 
            className="sm:mr-auto border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl font-bold"
          >
            Sign Out
          </Button>
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={loading}
            className="bg-primary text-primary-foreground border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl font-bold"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
