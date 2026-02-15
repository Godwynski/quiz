"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Slider } from "../../../components/ui/slider";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { User as UserIcon } from "lucide-react";
import { profileService } from "../services/profileService";
import { quizService } from "@/app/features/quiz/services/quizService";
import Cropper, { Area } from 'react-easy-crop';
import getCroppedImg from "@/app/utils/canvasUtils";

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
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Cropping State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const fetchProfile = async () => {
        try {
          const profile = await profileService.getProfile(user.id);
          if (profile) {
            setUsername(profile.username || "");
            setAvatarUrl(profile.avatar_url || "");
            setTotalXp(profile.total_xp);
            setLeague(profile.current_league);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      fetchProfile();
    }
  }, [user, isOpen]);

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsCropping(true);
      // Reset cropper state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.readAsDataURL(file);
    });
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;
    
    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      if (!croppedImage) {
         throw new Error("Failed to crop image");
      }

      // Upload the cropped image blob directly
      const publicUrl = await profileService.uploadAvatar(user.id, croppedImage);
      
      setAvatarUrl(publicUrl);
      setIsCropping(false);
      setImageSrc(null);
      toast.success("Image cropped and uploaded!");
    } catch (error) {
      console.error('Crop/Upload Error:', error);
      toast.error("Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await profileService.updateProfile(user.id, {
        username,
        avatar_url: avatarUrl
      });

      toast.success("Profile updated!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
     if (!user) return;
     setClearingHistory(true);
     try {
        await quizService.clearHistory();
        toast.success("History and XP cleared.");
        
        // Refresh local state to reflect reset
        setTotalXp(0);
        setLeague("Bronze");
        setShowClearHistoryConfirm(false);
     } catch (err) {
        console.error("Failed to clear history:", err);
        toast.error("Failed to clear history.");
     } finally {
        setClearingHistory(false);
     }
  };

  // If cropping, show the cropper UI instead of the normal profile editor
  if (isCropping && imageSrc) {
     return (
        <Dialog open={true} onOpenChange={() => setIsCropping(false)}>
           <DialogContent className="w-[90%] h-[90vh] sm:h-auto sm:max-w-[500px] border-4 border-black doodle-border bg-[#fff9f0] p-0 overflow-hidden flex flex-col">
              <DialogHeader className="p-6 pb-2">
                 <DialogTitle>Crop Profile Picture</DialogTitle>
                 <DialogDescription>Drag to position and pinch/scroll to zoom.</DialogDescription>
              </DialogHeader>
              
              <div className="relative flex-1 min-h-[300px] w-full bg-black/5">
                 <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                 />
              </div>

              <div className="p-6 space-y-4 bg-white border-t border-border">
                 <div className="space-y-2">
                    <Label>Zoom</Label>
                    <Slider 
                       value={[zoom]} 
                       min={1} 
                       max={3} 
                       step={0.1} 
                       onValueChange={(val: number[]) => setZoom(val[0])} 
                    />
                 </div>
                 <div className="flex justify-between gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsCropping(false)} className="flex-1">
                       Cancel
                    </Button>
                    <Button onClick={handleCropSave} className="flex-1" disabled={loading}>
                       {loading ? "Processing..." : "Apply & Upload"}
                    </Button>
                 </div>
              </div>
           </DialogContent>
        </Dialog>
     );
  }

  return (
    <>
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
               onChange={handleFileChange}
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
        
        <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setShowClearHistoryConfirm(true)}
             className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 text-xs uppercase tracking-widest font-bold"
           >
             Danger: Reset My Profile
           </Button>
        </div>
      </DialogContent>
    </Dialog>
    
    <Dialog open={showClearHistoryConfirm} onOpenChange={setShowClearHistoryConfirm}>
       <DialogContent className="border-4 border-red-600 bg-red-50 sm:max-w-[425px]">
          <DialogHeader>
             <DialogTitle className="text-red-600 font-black uppercase text-2xl">Reset Profile?</DialogTitle>
             <DialogDescription className="text-red-800 font-medium text-base">
                This will <strong>permanently delete</strong> all your quiz history and <strong>reset your XP/League</strong> to zero. 
                <br/><br/>
                This cannot be undone. Are you sure?
             </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" onClick={() => setShowClearHistoryConfirm(false)} className="border-2 border-red-200">
                Cancel
             </Button>
             <Button 
                variant="destructive" 
                onClick={handleClearHistory}
                disabled={clearingHistory}
                className="bg-red-600 hover:bg-red-700 border-2 border-red-900 font-bold"
             >
                {clearingHistory ? "Resetting..." : "Yes, Reset Everything"}
             </Button>
          </DialogFooter>
       </DialogContent>
    </Dialog>
    </>
  );
}
