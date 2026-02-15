import { supabase } from "@/app/lib/supabase";
import { Database } from "@/app/types/supabase";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_league: string;
}

type ProfileUpdateInput = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, total_xp, current_league')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
    const payload: ProfileUpdateInput = {
      username: updates.username,
      avatar_url: updates.avatar_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload as unknown as never)
      .eq('id', userId);

    if (error) throw error;
  },

  async uploadAvatar(userId: string, file: Blob): Promise<string> {
    // 1. Validation: Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("File size must be less than 2MB");
    }

    const fileExt = 'jpg';
    const fileName = `${userId}.${fileExt}`; // Consistent filename to overwrite old
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Add cache busting param to ensure UI updates immediately
    return `${publicUrl}?t=${Date.now()}`;
  }
};
