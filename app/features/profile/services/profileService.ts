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
      // @ts-expect-error: Suppress type error due to complex generic inference issue with Partial<Profile> and Supabase Update type
      .update(payload as any)
      .eq('id', userId);

    if (error) throw error;
  },

  async uploadAvatar(userId: string, file: Blob): Promise<string> {
    const fileExt = 'jpg';
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
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

    return publicUrl;
  }
};
