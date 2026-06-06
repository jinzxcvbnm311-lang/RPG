import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// Enforce port 3000 as specified in container limits
const PORT = 3000;
const app = express();

app.use(express.json());

// Ensure persistent directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

// Helper to load users database
function loadUsersDB(): Record<string, any> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf-8');
      return {};
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (error) {
    console.error('Error loading users DB:', error);
    return {};
  }
}

// Helper to save users database
function saveUsersDB(db: Record<string, any>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving users DB:', error);
  }
}

// Simple hash implementation for passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// --- API Endpoints ---

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password || !nickname) {
      return res.status(400).json({ error: '아이디, 비밀번호, 닉네임은 필수입니다.' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const db = loadUsersDB();

    if (db[trimmedUsername]) {
      return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
    }

    // Hashpassword
    const passwordHash = hashPassword(password);

    // Initial default game state
    const defaultState = {
      userId: trimmedUsername,
      nickname: nickname.trim(),
      level: 1,
      exp: 0,
      nextExp: 20,
      gold: 0,
      rebirthPoints: 0,
      rebirthCount: 0,
      bossKills: 0,
      rebirthUpgrades: {
        attackMultiplier: 0,
        expMultiplier: 0,
        dropMultiplier: 0,
        goldMultiplier: 0
      },
      equippedItems: {
        helmet: null,
        armor: null,
        pants: null,
        shoes: null,
        weapon: null
      },
      inventory: [],
      upgradeStones: { t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0, t7: 0 },
      skills: {
        attackLevel: 0,
        defenseLevel: 0,
        criticalLevel: 0,
        autoHuntLevel: 0,
        dropLevel: 0
      },
      unlockedHuntingZones: ['초보자의 숲'],
      currentHuntingZone: '초보자의 숲',
      huntingZoneKills: 0,
      achievements: {
        slimeKills: 0,
        demonLordKills: 0,
        totalKills: 0,
        totalClicks: 0,
        totalGoldEarned: 0,
        unlockedAchievements: []
      }
    };

    db[trimmedUsername] = {
      username: trimmedUsername,
      passwordHash,
      createdAt: new Date().toISOString(),
      gameState: defaultState
    };

    saveUsersDB(db);

    res.status(201).json({
      message: '회원가입 완료 및 계정이 생성되었습니다.',
      user: {
        userId: trimmedUsername,
        nickname: defaultState.nickname,
        gameState: defaultState
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: '서버 에러가 발생했습니다: ' + error.message });
  }
});

// 3. Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const db = loadUsersDB();
    const user = db[trimmedUsername];

    if (!user) {
      return res.status(401).json({ error: '존재하지 않는 아이디입니다.' });
    }

    const checkHash = hashPassword(password);
    if (user.passwordHash !== checkHash) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }

    res.json({
      message: '성공적으로 로그인하였습니다.',
      user: {
        userId: user.username,
        nickname: user.gameState.nickname,
        gameState: user.gameState
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다: ' + error.message });
  }
});

// 4. Save Progress
app.post('/api/game/save', (req, res) => {
  try {
    const { userId, gameState } = req.body;

    if (!userId || !gameState) {
      return res.status(400).json({ error: '저장 정보가 올바르지 않습니다.' });
    }

    const trimmedUserId = userId.trim().toLowerCase();
    const db = loadUsersDB();

    if (!db[trimmedUserId]) {
      return res.status(404).json({ error: '해당 사용자 계정을 찾을 수 없습니다.' });
    }

    // Save state
    db[trimmedUserId].gameState = gameState;
    db[trimmedUserId].updatedAt = new Date().toISOString();
    saveUsersDB(db);

    res.json({ message: '게임 진행 상황이 클라우드에 성공적으로 백업되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ error: '저장 처리 중 에러가 발생했습니다: ' + error.message });
  }
});

// Helper calculation to obtain a user's calculated max attack power for leaderboard rankings
function calculateMaxAttack(gameState: any): number {
  let baseAttack = 10 + (gameState.level - 1) * 2;
  if (gameState.level >= 100) {
    baseAttack += (gameState.level - 99) * 4; // bonus scaling past 100
  }

  // Skill bonus
  const skillAttackBonus = (gameState.skills?.attackLevel || 0) * 5;
  baseAttack += skillAttackBonus;

  // Equipment weapon bonus
  let weaponBonus = 0;
  let multiplierBonusPercent = 0;

  if (gameState.equippedItems?.weapon) {
    const weapon = gameState.equippedItems.weapon;
    let baseWeaponStat = weapon.baseStat || 0;
    // Enhance level multiplies weapon stat (+10% base stat per enhancement level)
    baseWeaponStat = baseWeaponStat + Math.floor(baseWeaponStat * (weapon.enhanceLevel || 0) * 0.15);
    weaponBonus += baseWeaponStat;

    // Item options
    if (weapon.options) {
      for (const opt of weapon.options) {
        if (opt.statName === 'attack_flat') {
          weaponBonus += opt.value;
        } else if (opt.statName === 'attack_percent') {
          multiplierBonusPercent += opt.value;
        }
      }
    }
  }

  // Check options on other equipment (helmet, armor, pants, shoes)
  const slots = ['helmet', 'armor', 'pants', 'shoes'];
  for (const slot of slots) {
    const item = gameState.equippedItems?.[slot];
    if (item && item.options) {
      for (const opt of item.options) {
        if (opt.statName === 'attack_flat') {
          weaponBonus += opt.value;
        } else if (opt.statName === 'attack_percent') {
          multiplierBonusPercent += opt.value;
        }
      }
    }
  }

  // Rebirth multiplier (bought with rebirthPoints)
  const rebirthPointsSpentOnAttack = gameState.rebirthUpgrades?.attackMultiplier || 0;
  // +15% multiplier per point, compound or additive. Let's do compound (1.15^pts)
  const rebirthMult = Math.pow(1.15, rebirthPointsSpentOnAttack);

  const totalAttack = Math.floor((baseAttack + weaponBonus) * (1 + multiplierBonusPercent / 100) * rebirthMult);
  return totalAttack;
}

// 5. Global Leaderboards
app.get('/api/game/rankings', (req, res) => {
  try {
    const db = loadUsersDB();
    const usersList = Object.values(db).map((u: any) => {
      const gs = u.gameState;
      return {
        userId: gs.userId,
        nickname: gs.nickname,
        level: gs.level || 1,
        rebirthCount: gs.rebirthCount || 0,
        bossKills: gs.bossKills || 0,
        maxAttack: calculateMaxAttack(gs)
      };
    });

    // 1. Level rankings
    const levelRank = [...usersList]
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.rebirthCount - a.rebirthCount; // tie-breaker
      })
      .slice(0, 15)
      .map((user, idx) => ({
        userId: user.userId,
        nickname: user.nickname,
        value: user.level,
        rank: idx + 1
      }));

    // 2. Attack rankings
    const attackRank = [...usersList]
      .sort((a, b) => b.maxAttack - a.maxAttack)
      .slice(0, 15)
      .map((user, idx) => ({
        userId: user.userId,
        nickname: user.nickname,
        value: user.maxAttack,
        rank: idx + 1
      }));

    // 3. Rebirth rankings
    const rebirthRank = [...usersList]
      .sort((a, b) => b.rebirthCount - a.rebirthCount)
      .slice(0, 15)
      .map((user, idx) => ({
        userId: user.userId,
        nickname: user.nickname,
        value: user.rebirthCount,
        rank: idx + 1
      }));

    // 4. Boss Kill rankings
    const bossKillsRank = [...usersList]
      .sort((a, b) => b.bossKills - a.bossKills)
      .slice(0, 15)
      .map((user, idx) => ({
        userId: user.userId,
        nickname: user.nickname,
        value: user.bossKills,
        rank: idx + 1
      }));

    res.json({
      levelRank,
      attackRank,
      rebirthRank,
      bossKillsRank
    });
  } catch (error: any) {
    res.status(500).json({ error: '랭킹 데이터를 가져오는데 오류가 발생했습니다: ' + error.message });
  }
});


// --- Serve Client Front-End and Mount Vite middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Endless Hunter] Full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
