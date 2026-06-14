import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '';

// Safely initialize the client. If URL or Key is missing, it will log a warning.
export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Utility to save GameState directly to Supabase client-side if enabled
 */
export async function saveGameStateToSupabase(userId: string, nickname: string, gameState: any) {
  if (!supabase) {
    console.warn("Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    return { success: false, error: "Settings missing" };
  }

  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        nickname: nickname,
        game_state: gameState,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error("Supabase Save Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Supabase Save Unexpected Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Utility to load GameState directly from Supabase client-side
 */
export async function loadGameStateFromSupabase(userId: string) {
  if (!supabase) {
    return { success: false, error: "Settings missing" };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('game_state, nickname')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, safe fallback (usually new user)
        return { success: true, data: null };
      }
      console.error("Supabase Load Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.game_state, nickname: data?.nickname };
  } catch (err: any) {
    console.error("Supabase Load Unexpected Error:", err);
    return { success: false, error: err.message };
  }
}
