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

/**
 * Browser-compatible SHA-256 hashing
 */
export async function hashPasswordClient(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Register user directly from client-side if server is unavailable (e.g. static Vercel build)
 */
export async function registerDirectToSupabase(username: string, password: string, nickname: string, defaultState: any) {
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되어 있지 않습니다. .env를 확인해주세요." };
  }

  try {
    const trimmedUsername = username.trim().toLowerCase();
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', trimmedUsername)
      .maybeSingle();

    if (checkError) {
      return { success: false, error: 'DB 조회 실패: ' + checkError.message };
    }

    if (existingUser) {
      return { success: false, error: '이미 존재하는 아이디입니다.' };
    }

    const hashed = await hashPasswordClient(password);

    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: trimmedUsername,
        nickname: nickname.trim(),
        password_hash: hashed,
        game_state: defaultState,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      return { success: false, error: 'DB 가입 실패: ' + insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Login user directly from client-side if server is unavailable
 */
export async function loginDirectToSupabase(username: string, password: string) {
  if (!supabase) {
    return { success: false, error: "Supabase가 설정되어 있지 않습니다." };
  }

  try {
    const trimmedUsername = username.trim().toLowerCase();
    
    const { data: user, error: loginError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', trimmedUsername)
      .maybeSingle();

    if (loginError) {
      return { success: false, error: 'DB 로그인 조회 실패: ' + loginError.message };
    }

    if (!user) {
      return { success: false, error: '존재하지 않는 아이디입니다.' };
    }

    const hashed = await hashPasswordClient(password);
    if (user.password_hash !== hashed) {
      return { success: false, error: '비밀번호가 올바르지 않습니다.' };
    }

    return { 
      success: true, 
      user: {
        userId: trimmedUsername,
        nickname: user.nickname,
        gameState: user.game_state
      } 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch rankings directly from client-side if server is unavailable
 */
export async function getRankingsDirectFromSupabase() {
  if (!supabase) {
    return null;
  }

  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id, nickname, game_state');

    if (error) {
      console.error("Rankings fetch error:", error);
      return null;
    }

    // Reuse the same logic for calculations on client side
    const calculateMaxAttackClient = (gameState: any): number => {
      if (!gameState) return 10;
      let baseAttack = 10 + ((gameState.level || 1) - 1) * 2;
      if ((gameState.level || 1) >= 100) {
        baseAttack += ((gameState.level || 1) - 99) * 4;
      }
      const skillAttackBonus = (gameState.skills?.attackLevel || 0) * 5;
      baseAttack += skillAttackBonus;

      let weaponBonus = 0;
      let multiplierBonusPercent = 0;

      if (gameState.equippedItems?.weapon) {
        const weapon = gameState.equippedItems.weapon;
        let baseWeaponStat = weapon.baseStat || 0;
        baseWeaponStat = baseWeaponStat + Math.floor(baseWeaponStat * (weapon.enhanceLevel || 0) * 0.15);
        weaponBonus += baseWeaponStat;
        if (weapon.options) {
          for (const opt of weapon.options) {
            if (opt.statName === 'attack_flat') weaponBonus += opt.value;
            else if (opt.statName === 'attack_percent') multiplierBonusPercent += opt.value;
          }
        }
      }

      const slots = ['helmet', 'armor', 'pants', 'shoes'];
      for (const slot of slots) {
        const item = gameState.equippedItems?.[slot];
        if (item && item.options) {
          for (const opt of item.options) {
            if (opt.statName === 'attack_flat') weaponBonus += opt.value;
            else if (opt.statName === 'attack_percent') multiplierBonusPercent += opt.value;
          }
        }
      }

      const rebirthPointsSpentOnAttack = gameState.rebirthUpgrades?.attackMultiplier || 0;
      const rebirthMult = Math.pow(1.15, rebirthPointsSpentOnAttack);
      return Math.floor((baseAttack + weaponBonus) * (1 + multiplierBonusPercent / 100) * rebirthMult);
    };

    const usersList = (profiles || []).map((u: any) => {
      const gs = u.game_state;
      return {
        userId: u.user_id,
        nickname: u.nickname || gs?.nickname || 'Unknown',
        level: gs?.level || 1,
        rebirthCount: gs?.rebirthCount || 0,
        bossKills: gs?.bossKills || 0,
        maxAttack: calculateMaxAttackClient(gs)
      };
    });

    // Sort to produce ranks
    const levelRank = [...usersList]
      .sort((a, b) => b.level !== a.level ? b.level - a.level : b.rebirthCount - a.rebirthCount)
      .slice(0, 15)
      .map((user, idx) => ({ userId: user.userId, nickname: user.nickname, value: user.level, rank: idx + 1 }));

    const attackRank = [...usersList]
      .sort((a, b) => b.maxAttack - a.maxAttack)
      .slice(0, 15)
      .map((user, idx) => ({ userId: user.userId, nickname: user.nickname, value: user.maxAttack, rank: idx + 1 }));

    const rebirthRank = [...usersList]
      .sort((a, b) => b.rebirthCount - a.rebirthCount)
      .slice(0, 15)
      .map((user, idx) => ({ userId: user.userId, nickname: user.nickname, value: user.rebirthCount, rank: idx + 1 }));

    const bossKillsRank = [...usersList]
      .sort((a, b) => b.bossKills - a.bossKills)
      .slice(0, 15)
      .map((user, idx) => ({ userId: user.userId, nickname: user.nickname, value: user.bossKills, rank: idx + 1 }));

    return { levelRank, attackRank, rebirthRank, bossKillsRank };
  } catch (err) {
    console.error("Direct rankings load failed:", err);
    return null;
  }
}
