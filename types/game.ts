export type GameState = 'START' | 'PLAYING' | 'UPGRADING' | 'PAUSED' | 'GAMEOVER';

export type WeaponType = 'PISTOL' | 'SHOTGUN' | 'RIFLE' | 'PLASMA' | 'RAILGUN';

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  bulletSpeed: number;
  bulletCount: number; // for shotgun
  spread: number; // in radians
  ammoMax: number;
  reloadTime: number; // in ms
  color: string;
  bulletRadius: number;
  pierce: number;
  explosiveRadius?: number;
  screenShake: number;
  soundPitch: number;
  description: string;
  unlocked: boolean;
}

export interface PlayerStats {
  x: number;
  y: number;
  radius: number;
  angle: number;
  speed: number;
  baseSpeed: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRegenRate: number;
  shieldRegenDelay: number;
  lastDamageTime: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  score: number;
  combo: number;
  comboTimer: number;
  dashCooldown: number;
  lastDashTime: number;
  isDashing: boolean;
  dashDuration: number;
  magnetRadius: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  speedBoostTimer: number;
  quadDamageTimer: number;
  invulnerableTimer: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  glowColor: string;
  pierce: number;
  hitsLeft: number;
  isEnemy: boolean;
  explosiveRadius?: number;
  lifetime: number;
  maxLifetime: number;
  bouncesLeft: number;
}

export type EnemyType = 'CRAWLER' | 'STALKER' | 'BRUTE' | 'SPITTER' | 'BOSS';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  color: string;
  scoreValue: number;
  xpValue: number;
  lastAttackTime: number;
  attackCooldown: number;
  chargeTimer?: number;
  isCharging?: boolean;
  shootCooldown?: number;
  lastShootTime?: number;
  bossPhase?: number;
  ringShootTimer?: number;
}

export type DropType = 'XP' | 'HEALTH' | 'SHIELD' | 'AMMO' | 'OVERDRIVE' | 'QUAD_DAMAGE' | 'SPEED';

export interface DropItem {
  id: number;
  type: DropType;
  x: number;
  y: number;
  radius: number;
  color: string;
  value: number;
  createdAt: number;
  lifetime: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'SPARK' | 'BLOOD' | 'SMOKE' | 'EXPLOSION' | 'TRAIL';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  vy: number;
  lifetime: number;
}

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  iconName: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  apply: (player: PlayerStats, weapons: Record<WeaponType, WeaponConfig>) => void;
}

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  screenShakeEnabled: boolean;
  autoFire: boolean;
  mobileControls: boolean;
}

export interface MobileInputState {
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  isAiming: boolean;
  isShooting: boolean;
  dashRequested: boolean;
  reloadRequested: boolean;
}
