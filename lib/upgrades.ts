import { UpgradeOption } from "@/types/game";

export const UPGRADE_POOL: UpgradeOption[] = [
  {
    id: "titan_plating",
    title: "Titan Armor",
    description: "+30 Max HP and instantly restores 30 Health.",
    iconName: "ShieldPlus",
    rarity: "COMMON",
    apply: (player) => {
      player.maxHealth += 30;
      player.health = Math.min(player.maxHealth, player.health + 30);
    },
  },
  {
    id: "hardlight_barrier",
    title: "Hardlight Shield",
    description: "+25 Max Shield & shield recharge delay reduced by 30%.",
    iconName: "Shield",
    rarity: "COMMON",
    apply: (player) => {
      player.maxShield += 25;
      player.shield = player.maxShield;
      player.shieldRegenDelay = Math.max(800, player.shieldRegenDelay * 0.7);
      player.shieldRegenRate += 5;
    },
  },
  {
    id: "overclock_thrusters",
    title: "Overclock Thrusters",
    description: "+18% Movement Speed and 25% faster Dash cooldown.",
    iconName: "Zap",
    rarity: "COMMON",
    apply: (player) => {
      player.speed = player.speed * 1.18;
      player.baseSpeed = player.baseSpeed * 1.18;
      player.dashCooldown = Math.max(600, player.dashCooldown * 0.75);
    },
  },
  {
    id: "hyper_velocity",
    title: "Hyper-Velocity Munitions",
    description: "+25% Damage multiplier across all weapons.",
    iconName: "Flame",
    rarity: "RARE",
    apply: (player) => {
      player.damageMultiplier *= 1.25;
    },
  },
  {
    id: "hair_trigger",
    title: "Rapid Fire Capacitor",
    description: "+30% Fire Rate across all weapons.",
    iconName: "FastForward",
    rarity: "RARE",
    apply: (player) => {
      player.fireRateMultiplier *= 1.3;
    },
  },
  {
    id: "extended_magazines",
    title: "Extended Mags",
    description: "+50% Ammo capacity & 35% faster reload times.",
    iconName: "Disc",
    rarity: "COMMON",
    apply: (_, weapons) => {
      Object.values(weapons).forEach((w) => {
        if (w.ammoMax < 9999) {
          w.ammoMax = Math.round(w.ammoMax * 1.5);
          w.reloadTime = Math.round(w.reloadTime * 0.65);
        }
      });
    },
  },
  {
    id: "depleted_uranium",
    title: "Piercing Rounds",
    description: "All bullets pierce through +1 additional target.",
    iconName: "Crosshair",
    rarity: "RARE",
    apply: (_, weapons) => {
      Object.values(weapons).forEach((w) => {
        w.pierce += 1;
      });
    },
  },
  {
    id: "magnetic_vacuum",
    title: "Graviton Magnet",
    description: "+80% Pickup collection radius for XP and Power-ups.",
    iconName: "Magnet",
    rarity: "COMMON",
    apply: (player) => {
      player.magnetRadius *= 1.8;
    },
  },
  {
    id: "ricochet",
    title: "Kinetic Bouncers",
    description: "Bullets bounce off arena perimeter walls 1 time.",
    iconName: "Repeat",
    rarity: "EPIC",
    apply: () => {
      // Flag handled in bullet physics
    },
  },
  {
    id: "overdrive_generator",
    title: "Nuclear Overdrive",
    description: "+40% All Damage and unlocks all locked heavy weapons!",
    iconName: "Sparkles",
    rarity: "LEGENDARY",
    apply: (player, weapons) => {
      player.damageMultiplier *= 1.4;
      Object.values(weapons).forEach((w) => (w.unlocked = true));
    },
  },
];

export function getRandomUpgrades(count = 3): UpgradeOption[] {
  const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
