"use client";

import React, { useEffect, useRef } from "react";
import {
  Bullet,
  DropItem,
  Enemy,
  FloatingText,
  GameState,
  MobileInputState,
  Particle,
  PlayerStats,
  WeaponConfig,
  WeaponType,
} from "@/types/game";
import { sound } from "@/lib/audio";
import { DEFAULT_WEAPONS } from "@/lib/weapons";

interface GameCanvasProps {
  gameState: GameState;
  restartTrigger: number;
  onGameOver: (finalScore: number, wavesCleared: number, enemiesKilled: number) => void;
  onLevelUp: () => void;
  onWaveComplete: (wave: number) => void;
  onStatsUpdate: (stats: {
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
    ammo: number;
    maxAmmo: number;
    isReloading: boolean;
    reloadProgress: number;
    score: number;
    combo: number;
    level: number;
    xp: number;
    xpToNextLevel: number;
    wave: number;
    activeWeapon: WeaponType;
    weapons: Record<WeaponType, WeaponConfig>;
    dashReady: boolean;
    activePowerup: string | null;
  }) => void;
  autoFire: boolean;
  screenShakeEnabled: boolean;
  activeWeapon: WeaponType;
  onWeaponChange: (weapon: WeaponType) => void;
  playerStatsRef: React.MutableRefObject<PlayerStats | null>;
  weaponsRef: React.MutableRefObject<Record<WeaponType, WeaponConfig>>;
  mobileInputRef: React.MutableRefObject<MobileInputState>;
  mobileControls: boolean;
}

const ARENA_WIDTH = 2600;
const ARENA_HEIGHT = 2600;

function createInitialGameState() {
  return {
    player: {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
      radius: 18,
      angle: 0,
      speed: 4.8,
      baseSpeed: 4.8,
      health: 100,
      maxHealth: 100,
      shield: 60,
      maxShield: 60,
      shieldRegenRate: 15,
      shieldRegenDelay: 2200,
      lastDamageTime: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      score: 0,
      combo: 1,
      comboTimer: 0,
      dashCooldown: 1200,
      lastDashTime: 0,
      isDashing: false,
      dashDuration: 220,
      magnetRadius: 160,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      speedBoostTimer: 0,
      quadDamageTimer: 0,
      invulnerableTimer: 0,
    } as PlayerStats,
    weapons: structuredClone(DEFAULT_WEAPONS) as Record<WeaponType, WeaponConfig>,
    ammo: {
      PISTOL: 999999,
      SHOTGUN: 8,
      RIFLE: 40,
      PLASMA: 6,
      RAILGUN: 4,
    } as Record<WeaponType, number>,
    isReloading: false,
    reloadStartTime: 0,
    currentReloadTime: 0,
    lastShootTime: 0,
    activeWeapon: "PISTOL" as WeaponType,
    wave: 1,
    enemiesKilled: 0,
    waveTotalEnemies: 12,
    waveSpawnedEnemies: 0,
    waveSpawningActive: true,
    lastSpawnTime: 0,
    spawnInterval: 1200,
    isWaveEnding: false,
    nextWaveCountdown: 0,

    // Entities
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    drops: [] as DropItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],

    // Controls
    keys: {} as Record<string, boolean>,
    mouse: { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false },

    // Visuals
    camera: { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 },
    screenShake: { x: 0, y: 0, intensity: 0 },
    lastFrameTime: performance.now(),
  };
}

export default function GameCanvas({
  gameState,
  restartTrigger,
  onGameOver,
  onLevelUp,
  onWaveComplete,
  onStatsUpdate,
  autoFire,
  screenShakeEnabled,
  activeWeapon,
  onWeaponChange,
  playerStatsRef,
  weaponsRef,
  mobileInputRef,
  mobileControls,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gameplay state kept in persistent mutable ref to maintain 60-120 FPS
  const stateRef = useRef(createInitialGameState());
  const lastRestartTriggerRef = useRef(restartTrigger);

  // Keep external refs synchronized
  useEffect(() => {
    playerStatsRef.current = stateRef.current.player;
    weaponsRef.current = stateRef.current.weapons;
  }, [playerStatsRef, weaponsRef]);

  // Synchronize active weapon from UI props
  useEffect(() => {
    stateRef.current.activeWeapon = activeWeapon;
    stateRef.current.isReloading = false;
  }, [activeWeapon]);

  // Reset game state on explicit restart or when starting after death
  useEffect(() => {
    const isExplicitRestart = restartTrigger !== lastRestartTriggerRef.current;
    const isRestartAfterDeath = gameState === "PLAYING" && stateRef.current.player.health <= 0;
    if (isExplicitRestart || isRestartAfterDeath) {
      lastRestartTriggerRef.current = restartTrigger;
      const freshState = createInitialGameState();
      stateRef.current = freshState;
      playerStatsRef.current = freshState.player;
      weaponsRef.current = freshState.weapons;
      onStatsUpdate({
        health: freshState.player.health,
        maxHealth: freshState.player.maxHealth,
        shield: freshState.player.shield,
        maxShield: freshState.player.maxShield,
        ammo: freshState.ammo.PISTOL,
        maxAmmo: freshState.weapons.PISTOL.ammoMax,
        isReloading: false,
        reloadProgress: 0,
        score: 0,
        combo: 1,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        wave: 1,
        activeWeapon: "PISTOL",
        weapons: freshState.weapons,
        dashReady: true,
        activePowerup: null,
      });
    }
  }, [restartTrigger, gameState, playerStatsRef, weaponsRef, onStatsUpdate]);

  // Main Game Loop Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;

      // Weapon hotkeys (1 - 5)
      if (e.code === "Digit1" && stateRef.current.weapons.PISTOL.unlocked) onWeaponChange("PISTOL");
      if (e.code === "Digit2" && stateRef.current.weapons.SHOTGUN.unlocked) onWeaponChange("SHOTGUN");
      if (e.code === "Digit3" && stateRef.current.weapons.RIFLE.unlocked) onWeaponChange("RIFLE");
      if (e.code === "Digit4" && stateRef.current.weapons.PLASMA.unlocked) onWeaponChange("PLASMA");
      if (e.code === "Digit5" && stateRef.current.weapons.RAILGUN.unlocked) onWeaponChange("RAILGUN");

      // Reload
      if (e.code === "KeyR") {
        initiateReload();
      }

      // Dash (Space or Shift)
      if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        attemptDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
    };

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      stateRef.current.mouse.x = mouseX;
      stateRef.current.mouse.y = mouseY;

      // Calculate world coordinates
      const cam = stateRef.current.camera;
      stateRef.current.mouse.worldX = mouseX - canvas.width / 2 + cam.x;
      stateRef.current.mouse.worldY = mouseY - canvas.height / 2 + cam.y;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        stateRef.current.mouse.isDown = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        stateRef.current.mouse.isDown = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const weaponTypes: WeaponType[] = ["PISTOL", "SHOTGUN", "RIFLE", "PLASMA", "RAILGUN"];
      const unlocked = weaponTypes.filter((w) => stateRef.current.weapons[w].unlocked);
      const currentIndex = unlocked.indexOf(stateRef.current.activeWeapon);
      if (currentIndex === -1) return;

      const nextIndex =
        e.deltaY > 0
          ? (currentIndex + 1) % unlocked.length
          : (currentIndex - 1 + unlocked.length) % unlocked.length;

      onWeaponChange(unlocked[nextIndex]);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("wheel", handleWheel);

    // Helpers
    const attemptDash = () => {
      const s = stateRef.current;
      const now = performance.now();
      if (now - s.player.lastDashTime < s.player.dashCooldown) return;

      s.player.lastDashTime = now;
      s.player.isDashing = true;
      s.player.invulnerableTimer = s.player.dashDuration + 80;
      sound.playDash();

      // Dash Ghost effect
      for (let i = 0; i < 8; i++) {
        s.particles.push({
          id: Math.random(),
          x: s.player.x + (Math.random() * 20 - 10),
          y: s.player.y + (Math.random() * 20 - 10),
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          radius: 8 + Math.random() * 8,
          color: "#38bdf8",
          alpha: 0.8,
          decay: 0.04,
          type: "TRAIL",
        });
      }
    };

    const initiateReload = () => {
      const s = stateRef.current;
      const curW = s.weapons[s.activeWeapon];
      if (s.isReloading || curW.ammoMax >= 999999) return;
      if (s.ammo[s.activeWeapon] >= curW.ammoMax) return;

      s.isReloading = true;
      s.reloadStartTime = performance.now();
      s.currentReloadTime = curW.reloadTime;
      sound.playReload();
    };

    const triggerScreenShake = (amount: number) => {
      if (!screenShakeEnabled) return;
      stateRef.current.screenShake.intensity = Math.max(
        stateRef.current.screenShake.intensity,
        amount
      );
    };

    const spawnEnemy = (type: "CRAWLER" | "STALKER" | "BRUTE" | "SPITTER" | "BOSS") => {
      const s = stateRef.current;
      const p = s.player;

      // Spawn on perimeter circle around player (outside camera view)
      const angle = Math.random() * Math.PI * 2;
      const dist = 950 + Math.random() * 250;
      let ex = p.x + Math.cos(angle) * dist;
      let ey = p.y + Math.sin(angle) * dist;

      // Clamp to arena
      ex = Math.max(100, Math.min(ARENA_WIDTH - 100, ex));
      ey = Math.max(100, Math.min(ARENA_HEIGHT - 100, ey));

      // Wave scaling factor
      const waveMult = 1 + (s.wave - 1) * 0.22;

      let radius = 16;
      let hp = 40 * waveMult;
      let speed = 2.4;
      let damage = 14;
      let color = "#ef4444";
      let scoreVal = 50;
      let xpVal = 20;

      if (type === "STALKER") {
        radius = 14;
        hp = 30 * waveMult;
        speed = 3.6;
        damage = 18;
        color = "#eab308";
        scoreVal = 80;
        xpVal = 30;
      } else if (type === "BRUTE") {
        radius = 28;
        hp = 180 * waveMult;
        speed = 1.3;
        damage = 32;
        color = "#a855f7";
        scoreVal = 150;
        xpVal = 60;
      } else if (type === "SPITTER") {
        radius = 18;
        hp = 55 * waveMult;
        speed = 2.0;
        damage = 12;
        color = "#06b6d4";
        scoreVal = 100;
        xpVal = 40;
      } else if (type === "BOSS") {
        radius = 50;
        hp = 1400 * waveMult;
        speed = 1.1;
        damage = 45;
        color = "#dc2626";
        scoreVal = 1200;
        xpVal = 400;
        sound.playBossAlert();
      }

      s.enemies.push({
        id: Math.random(),
        type,
        x: ex,
        y: ey,
        vx: 0,
        vy: 0,
        radius,
        health: hp,
        maxHealth: hp,
        speed,
        damage,
        color,
        scoreValue: scoreVal,
        xpValue: xpVal,
        lastAttackTime: 0,
        attackCooldown: 800,
        shootCooldown: type === "SPITTER" ? 2200 : undefined,
        lastShootTime: performance.now(),
        ringShootTimer: type === "BOSS" ? 3000 : undefined,
      });
    };

    // --- GAME LOOP ---
    const loop = (currentTime: number) => {
      const s = stateRef.current;
      const dt = Math.min((currentTime - s.lastFrameTime) / 1000, 0.1);
      s.lastFrameTime = currentTime;

      if (gameState === "PLAYING") {
        // 1. UPDATE CONTROLS & PLAYER MOVEMENT
        const mobile = mobileInputRef.current;
        if (mobile.dashRequested) {
          mobile.dashRequested = false;
          attemptDash();
        }
        if (mobile.reloadRequested) {
          mobile.reloadRequested = false;
          initiateReload();
        }

        let moveX = mobile.moveX;
        let moveY = mobile.moveY;
        if (s.keys["KeyW"] || s.keys["ArrowUp"]) moveY -= 1;
        if (s.keys["KeyS"] || s.keys["ArrowDown"]) moveY += 1;
        if (s.keys["KeyA"] || s.keys["ArrowLeft"]) moveX -= 1;
        if (s.keys["KeyD"] || s.keys["ArrowRight"]) moveX += 1;

        const moveMag = Math.hypot(moveX, moveY);
        if (moveMag > 1) {
          moveX /= moveMag;
          moveY /= moveMag;
        }

        let currentSpeed = s.player.speed;
        if (s.player.speedBoostTimer > 0) {
          s.player.speedBoostTimer -= dt;
          currentSpeed *= 1.5;
        }

        // Handle dash speed burst
        const isDashing =
          currentTime - s.player.lastDashTime < s.player.dashDuration;
        s.player.isDashing = isDashing;
        if (isDashing) {
          currentSpeed *= 2.8;
        }

        if (s.player.quadDamageTimer > 0) {
          s.player.quadDamageTimer -= dt;
        }
        if (s.player.invulnerableTimer > 0) {
          s.player.invulnerableTimer -= dt * 1000;
        }

        s.player.x += moveX * currentSpeed;
        s.player.y += moveY * currentSpeed;

        // Keep inside arena boundaries
        const pad = s.player.radius + 15;
        s.player.x = Math.max(pad, Math.min(ARENA_WIDTH - pad, s.player.x));
        s.player.y = Math.max(pad, Math.min(ARENA_HEIGHT - pad, s.player.y));

        // Aiming angle
        if (mobile.isAiming && Math.hypot(mobile.aimX, mobile.aimY) > 0.1) {
          s.player.angle = Math.atan2(mobile.aimY, mobile.aimX);
        } else if (!mobileControls) {
          s.player.angle = Math.atan2(
            s.mouse.worldY - s.player.y,
            s.mouse.worldX - s.player.x
          );
        } else if (moveMag > 0.2) {
          s.player.angle = Math.atan2(moveY, moveX);
        }

        // Shield regeneration logic
        if (
          s.player.shield < s.player.maxShield &&
          currentTime - s.player.lastDamageTime > s.player.shieldRegenDelay
        ) {
          s.player.shield = Math.min(
            s.player.maxShield,
            s.player.shield + s.player.shieldRegenRate * dt
          );
        }

        // Combo decay
        if (s.player.comboTimer > 0) {
          s.player.comboTimer -= dt;
          if (s.player.comboTimer <= 0) {
            s.player.combo = 1;
          }
        }

        // Reload check
        if (s.isReloading) {
          if (currentTime - s.reloadStartTime >= s.currentReloadTime) {
            const curW = s.weapons[s.activeWeapon];
            s.ammo[s.activeWeapon] = curW.ammoMax;
            s.isReloading = false;
          }
        }

        // Auto-reload if empty
        if (
          !s.isReloading &&
          s.ammo[s.activeWeapon] <= 0 &&
          s.weapons[s.activeWeapon].ammoMax < 999999
        ) {
          initiateReload();
        }

        // 2. SHOOTING LOGIC
        const shouldShoot = (s.mouse.isDown || mobile.isShooting || autoFire) && !s.isReloading;
        const curW = s.weapons[s.activeWeapon];
        const effectiveFireRate = curW.fireRate / s.player.fireRateMultiplier;

        if (shouldShoot && currentTime - s.lastShootTime >= effectiveFireRate) {
          if (s.ammo[s.activeWeapon] > 0) {
            s.lastShootTime = currentTime;
            if (curW.ammoMax < 999999) {
              s.ammo[s.activeWeapon] -= 1;
            }

            sound.playShoot(s.activeWeapon);
            triggerScreenShake(curW.screenShake);

            // Muzzle flash particle
            s.particles.push({
              id: Math.random(),
              x: s.player.x + Math.cos(s.player.angle) * 26,
              y: s.player.y + Math.sin(s.player.angle) * 26,
              vx: Math.cos(s.player.angle) * 2,
              vy: Math.sin(s.player.angle) * 2,
              radius: 9,
              color: curW.color,
              alpha: 0.9,
              decay: 0.15,
              type: "SPARK",
            });

            // Calculate damage with player modifiers
            let finalDmg = curW.damage * s.player.damageMultiplier;
            if (s.player.quadDamageTimer > 0) {
              finalDmg *= 4;
            }

            // Spawn bullets (single or shotgun cone)
            const count = curW.bulletCount;
            const spread = curW.spread;
            const baseAngle = s.player.angle;

            for (let i = 0; i < count; i++) {
              let angleOffset = 0;
              if (count > 1) {
                angleOffset = (i / (count - 1) - 0.5) * spread;
              } else {
                angleOffset = (Math.random() - 0.5) * spread;
              }

              const bulletAngle = baseAngle + angleOffset;
              const vx = Math.cos(bulletAngle) * curW.bulletSpeed;
              const vy = Math.sin(bulletAngle) * curW.bulletSpeed;

              s.bullets.push({
                id: Math.random(),
                x: s.player.x + Math.cos(bulletAngle) * 24,
                y: s.player.y + Math.sin(bulletAngle) * 24,
                vx,
                vy,
                radius: curW.bulletRadius,
                damage: finalDmg,
                color: curW.color,
                glowColor: curW.color,
                pierce: curW.pierce,
                hitsLeft: curW.pierce,
                isEnemy: false,
                explosiveRadius: curW.explosiveRadius,
                lifetime: 0,
                maxLifetime: 2.2,
                bouncesLeft: 1,
              });
            }
          }
        }

        // 3. SPAWNER / WAVE DIRECTOR
        if (s.waveSpawningActive) {
          if (
            currentTime - s.lastSpawnTime >= s.spawnInterval &&
            s.waveSpawnedEnemies < s.waveTotalEnemies
          ) {
            s.lastSpawnTime = currentTime;
            s.waveSpawnedEnemies++;

            // Wave composition
            const roll = Math.random();
            if (s.wave >= 5 && s.waveSpawnedEnemies === 1) {
              // Boss at wave 5, 10, 15...
              spawnEnemy("BOSS");
            } else if (roll < 0.5) {
              spawnEnemy("CRAWLER");
            } else if (roll < 0.75) {
              spawnEnemy("STALKER");
            } else if (roll < 0.9) {
              spawnEnemy("SPITTER");
            } else {
              spawnEnemy("BRUTE");
            }
          }

          // Check if all spawned enemies in wave are dead
          if (
            s.waveSpawnedEnemies >= s.waveTotalEnemies &&
            s.enemies.length === 0 &&
            !s.isWaveEnding
          ) {
            s.isWaveEnding = true;
            s.nextWaveCountdown = 2.5;
            sound.playPowerup();
            onWaveComplete(s.wave);

            // Unlock weapons progressively
            if (s.wave === 1 && !s.weapons.SHOTGUN.unlocked) {
              s.weapons.SHOTGUN.unlocked = true;
              s.floatingTexts.push({
                id: Math.random(),
                x: s.player.x,
                y: s.player.y - 60,
                text: "WEAPON UNLOCKED: SCATTER CANNON (2)!",
                color: "#f97316",
                size: 20,
                alpha: 1.0,
                vy: -35,
                lifetime: 2.8,
              });
            } else if (s.wave === 2 && !s.weapons.RIFLE.unlocked) {
              s.weapons.RIFLE.unlocked = true;
              s.floatingTexts.push({
                id: Math.random(),
                x: s.player.x,
                y: s.player.y - 60,
                text: "WEAPON UNLOCKED: VORTEX CARBINE (3)!",
                color: "#a855f7",
                size: 20,
                alpha: 1.0,
                vy: -35,
                lifetime: 2.8,
              });
            } else if (s.wave === 3 && !s.weapons.PLASMA.unlocked) {
              s.weapons.PLASMA.unlocked = true;
              s.floatingTexts.push({
                id: Math.random(),
                x: s.player.x,
                y: s.player.y - 60,
                text: "WEAPON UNLOCKED: NOVA LAUNCHER (4)!",
                color: "#22c55e",
                size: 20,
                alpha: 1.0,
                vy: -35,
                lifetime: 2.8,
              });
            } else if (s.wave === 4 && !s.weapons.RAILGUN.unlocked) {
              s.weapons.RAILGUN.unlocked = true;
              s.floatingTexts.push({
                id: Math.random(),
                x: s.player.x,
                y: s.player.y - 60,
                text: "WEAPON UNLOCKED: QUASAR RAILGUN (5)!",
                color: "#ec4899",
                size: 20,
                alpha: 1.0,
                vy: -35,
                lifetime: 2.8,
              });
            }
          }
        }

        // Wave countdown transition
        if (s.isWaveEnding) {
          s.nextWaveCountdown -= dt;
          if (s.nextWaveCountdown <= 0) {
            s.isWaveEnding = false;
            s.wave++;
            s.waveSpawnedEnemies = 0;
            s.waveTotalEnemies = Math.round(12 + s.wave * 4.5);
            s.spawnInterval = Math.max(450, 1200 - s.wave * 70);
            s.floatingTexts.push({
              id: Math.random(),
              x: s.player.x,
              y: s.player.y - 80,
              text: `WAVE ${s.wave} COMMENCING`,
              color: "#38bdf8",
              size: 24,
              alpha: 1.0,
              vy: -40,
              lifetime: 2.2,
            });
          }
        }

        // 4. UPDATE BULLETS
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx;
          b.y += b.vy;
          b.lifetime += dt;

          // Wall collision & ricochet
          if (b.x < 20 || b.x > ARENA_WIDTH - 20) {
            if (b.bouncesLeft > 0) {
              b.vx = -b.vx;
              b.bouncesLeft--;
            } else {
              b.hitsLeft = 0;
            }
          }
          if (b.y < 20 || b.y > ARENA_HEIGHT - 20) {
            if (b.bouncesLeft > 0) {
              b.vy = -b.vy;
              b.bouncesLeft--;
            } else {
              b.hitsLeft = 0;
            }
          }

          // Enemy bullets hitting player
          if (b.isEnemy) {
            const distP = Math.hypot(b.x - s.player.x, b.y - s.player.y);
            if (distP < b.radius + s.player.radius) {
              if (s.player.invulnerableTimer <= 0) {
                applyDamageToPlayer(b.damage);
              }
              b.hitsLeft = 0;
            }
          } else {
            // Player bullets hitting enemies
            for (let j = 0; j < s.enemies.length; j++) {
              const enemy = s.enemies[j];
              const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
              if (dist < b.radius + enemy.radius) {
                // Apply damage
                const isCrit = Math.random() < 0.18;
                const hitDamage = isCrit ? b.damage * 2.2 : b.damage;
                enemy.health -= hitDamage;
                b.hitsLeft--;

                sound.playHit();

                // Spark particles
                for (let k = 0; k < 4; k++) {
                  s.particles.push({
                    id: Math.random(),
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    radius: 3,
                    color: b.color,
                    alpha: 0.9,
                    decay: 0.08,
                    type: "SPARK",
                  });
                }

                // Floating damage indicator
                s.floatingTexts.push({
                  id: Math.random(),
                  x: enemy.x + (Math.random() * 20 - 10),
                  y: enemy.y - enemy.radius - 8,
                  text: isCrit
                    ? `CRIT -${Math.round(hitDamage)}!`
                    : `-${Math.round(hitDamage)}`,
                  color: isCrit ? "#facc15" : "#ffffff",
                  size: isCrit ? 16 : 13,
                  alpha: 1.0,
                  vy: -35,
                  lifetime: 0.7,
                });

                // Area of Effect Explosions (Nova Launcher)
                if (b.explosiveRadius) {
                  triggerScreenShake(8);
                  sound.playExplosion(true);

                  // Explosion visual shockwave
                  for (let p = 0; p < 18; p++) {
                    const blastAngle = Math.random() * Math.PI * 2;
                    const blastSpeed = 2 + Math.random() * 7;
                    s.particles.push({
                      id: Math.random(),
                      x: b.x,
                      y: b.y,
                      vx: Math.cos(blastAngle) * blastSpeed,
                      vy: Math.sin(blastAngle) * blastSpeed,
                      radius: 6 + Math.random() * 8,
                      color: Math.random() > 0.5 ? "#22c55e" : "#facc15",
                      alpha: 0.9,
                      decay: 0.04,
                      type: "EXPLOSION",
                    });
                  }

                  // AOE damage to surrounding enemies
                  for (let m = 0; m < s.enemies.length; m++) {
                    const otherEnemy = s.enemies[m];
                    const blastDist = Math.hypot(
                      b.x - otherEnemy.x,
                      b.y - otherEnemy.y
                    );
                    if (blastDist < b.explosiveRadius) {
                      const aoeFalloff = 1 - blastDist / b.explosiveRadius;
                      otherEnemy.health -= hitDamage * 0.8 * aoeFalloff;
                    }
                  }
                }

                if (b.hitsLeft <= 0) break;
              }
            }
          }

          // Remove dead bullets
          if (b.hitsLeft <= 0 || b.lifetime >= b.maxLifetime) {
            s.bullets.splice(i, 1);
          }
        }

        // 5. UPDATE ENEMIES
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const enemy = s.enemies[i];

          // Check if dead
          if (enemy.health <= 0) {
            sound.playEnemyDeath();
            triggerScreenShake(enemy.type === "BOSS" ? 12 : 3);
            s.enemiesKilled++;

            // Scoring & Combo
            s.player.score += enemy.scoreValue * s.player.combo;
            s.player.combo = Math.min(10, s.player.combo + 1);
            s.player.comboTimer = 3.5;

            // Add XP
            addXP(enemy.xpValue);

            // Splatter particles
            for (let k = 0; k < (enemy.type === "BOSS" ? 35 : 12); k++) {
              s.particles.push({
                id: Math.random(),
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: 4 + Math.random() * 5,
                color: enemy.color,
                alpha: 0.85,
                decay: 0.03,
                type: "BLOOD",
              });
            }

            // Power-up & XP drops
            spawnDropsForEnemy(enemy);

            s.enemies.splice(i, 1);
            continue;
          }

          // Move enemy towards player
          const dx = s.player.x - enemy.x;
          const dy = s.player.y - enemy.y;
          const dist = Math.hypot(dx, dy);

          let targetVx = (dx / dist) * enemy.speed;
          let targetVy = (dy / dist) * enemy.speed;

          // Spitter behavior: keep distance and shoot
          if (enemy.type === "SPITTER") {
            if (dist < 340) {
              targetVx = -targetVx * 1.1;
              targetVy = -targetVy * 1.1;
            } else if (dist > 500) {
              targetVx *= 1.2;
              targetVy *= 1.2;
            } else {
              targetVx = 0;
              targetVy = 0;
            }

            if (currentTime - (enemy.lastShootTime || 0) >= (enemy.shootCooldown || 2200)) {
              enemy.lastShootTime = currentTime;
              sound.playEnemyShoot();
              const shootAngle = Math.atan2(dy, dx);
              s.bullets.push({
                id: Math.random(),
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(shootAngle) * 6.5,
                vy: Math.sin(shootAngle) * 6.5,
                radius: 5,
                damage: enemy.damage,
                color: "#06b6d4",
                glowColor: "#06b6d4",
                pierce: 1,
                hitsLeft: 1,
                isEnemy: true,
                lifetime: 0,
                maxLifetime: 3.5,
                bouncesLeft: 0,
              });
            }
          }

          // Boss behavior: periodic radial barrage
          if (enemy.type === "BOSS") {
            if (currentTime - (enemy.lastShootTime || 0) >= (enemy.ringShootTimer || 3000)) {
              enemy.lastShootTime = currentTime;
              sound.playBossAlert();
              const ringCount = 12;
              for (let r = 0; r < ringCount; r++) {
                const ringAngle = (r / ringCount) * Math.PI * 2;
                s.bullets.push({
                  id: Math.random(),
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(ringAngle) * 5.5,
                  vy: Math.sin(ringAngle) * 5.5,
                  radius: 6,
                  damage: 18,
                  color: "#ef4444",
                  glowColor: "#ef4444",
                  pierce: 1,
                  hitsLeft: 1,
                  isEnemy: true,
                  lifetime: 0,
                  maxLifetime: 3.0,
                  bouncesLeft: 0,
                });
              }
            }
          }

          // Apply movement with mild inertia
          enemy.vx += (targetVx - enemy.vx) * 0.1;
          enemy.vy += (targetVy - enemy.vy) * 0.1;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          // Enemy collision with player (melee)
          if (dist < enemy.radius + s.player.radius) {
            if (
              currentTime - enemy.lastAttackTime >= enemy.attackCooldown &&
              s.player.invulnerableTimer <= 0
            ) {
              enemy.lastAttackTime = currentTime;
              applyDamageToPlayer(enemy.damage);
            }
          }
        }

        // 6. UPDATE DROPS & MAGNET
        for (let i = s.drops.length - 1; i >= 0; i--) {
          const drop = s.drops[i];
          const dist = Math.hypot(s.player.x - drop.x, s.player.y - drop.y);

          // Magnet vacuum effect
          if (dist < s.player.magnetRadius) {
            const pullSpeed = 9 + (1 - dist / s.player.magnetRadius) * 12;
            drop.x += ((s.player.x - drop.x) / dist) * pullSpeed;
            drop.y += ((s.player.y - drop.y) / dist) * pullSpeed;
          }

          // Collect item
          if (dist < drop.radius + s.player.radius) {
            collectDrop(drop);
            s.drops.splice(i, 1);
            continue;
          }

          // Drop expiration (after 30 seconds)
          if (currentTime - drop.createdAt > drop.lifetime) {
            s.drops.splice(i, 1);
          }
        }

        // 7. UPDATE PARTICLES
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            s.particles.splice(i, 1);
          }
        }

        // 8. UPDATE FLOATING TEXT
        for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
          const ft = s.floatingTexts[i];
          ft.y += ft.vy * dt;
          ft.lifetime -= dt;
          ft.alpha = Math.max(0, ft.lifetime / 1.0);
          if (ft.lifetime <= 0) {
            s.floatingTexts.splice(i, 1);
          }
        }

        // 9. UPDATE CAMERA & SCREEN SHAKE
        const camTargetX = s.player.x + (s.mouse.worldX - s.player.x) * 0.15;
        const camTargetY = s.player.y + (s.mouse.worldY - s.player.y) * 0.15;
        s.camera.x += (camTargetX - s.camera.x) * 0.12;
        s.camera.y += (camTargetY - s.camera.y) * 0.12;

        if (s.screenShake.intensity > 0) {
          s.screenShake.x = (Math.random() - 0.5) * s.screenShake.intensity * 2;
          s.screenShake.y = (Math.random() - 0.5) * s.screenShake.intensity * 2;
          s.screenShake.intensity = Math.max(0, s.screenShake.intensity - dt * 25);
        } else {
          s.screenShake.x = 0;
          s.screenShake.y = 0;
        }

        // 10. SYNC STATS TO REACT UI
        const curWObj = s.weapons[s.activeWeapon];
        const reloadProg = s.isReloading
          ? Math.min(1, (currentTime - s.reloadStartTime) / s.currentReloadTime)
          : 0;

        let activePowerupText: string | null = null;
        if (s.player.quadDamageTimer > 0) {
          activePowerupText = `QUAD DAMAGE (${Math.ceil(s.player.quadDamageTimer)}s)`;
        } else if (s.player.speedBoostTimer > 0) {
          activePowerupText = `HYPER SPEED (${Math.ceil(s.player.speedBoostTimer)}s)`;
        }

        onStatsUpdate({
          health: Math.round(s.player.health),
          maxHealth: s.player.maxHealth,
          shield: Math.round(s.player.shield),
          maxShield: s.player.maxShield,
          ammo: s.ammo[s.activeWeapon],
          maxAmmo: curWObj.ammoMax,
          isReloading: s.isReloading,
          reloadProgress: reloadProg,
          score: s.player.score,
          combo: s.player.combo,
          level: s.player.level,
          xp: s.player.xp,
          xpToNextLevel: s.player.xpToNextLevel,
          wave: s.wave,
          activeWeapon: s.activeWeapon,
          weapons: s.weapons,
          dashReady: currentTime - s.player.lastDashTime >= s.player.dashCooldown,
          activePowerup: activePowerupText,
        });
      }

      // --- RENDERING ---
      renderScene(ctx, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(loop);
    };

    // Helper: damage player
    const applyDamageToPlayer = (dmg: number) => {
      const s = stateRef.current;
      sound.playPlayerHurt();
      triggerScreenShake(7);
      s.player.lastDamageTime = performance.now();

      // Shield absorbs first
      if (s.player.shield > 0) {
        if (s.player.shield >= dmg) {
          s.player.shield -= dmg;
          dmg = 0;
        } else {
          dmg -= s.player.shield;
          s.player.shield = 0;
        }
      }

      // Remaining damage to health
      if (dmg > 0) {
        s.player.health -= dmg;
      }

      // Check death
      if (s.player.health <= 0) {
        s.player.health = 0;
        sound.playGameOver();
        onGameOver(s.player.score, s.wave, s.enemiesKilled);
      }
    };

    // Helper: XP leveling
    const addXP = (amount: number) => {
      const s = stateRef.current;
      s.player.xp += amount;
      if (s.player.xp >= s.player.xpToNextLevel) {
        s.player.xp -= s.player.xpToNextLevel;
        s.player.level++;
        s.player.xpToNextLevel = Math.round(s.player.xpToNextLevel * 1.35);
        sound.playLevelUp();
        onLevelUp();
      }
    };

    // Helper: drops
    const spawnDropsForEnemy = (enemy: Enemy) => {
      const s = stateRef.current;

      // Always drop XP gem
      s.drops.push({
        id: Math.random(),
        type: "XP",
        x: enemy.x,
        y: enemy.y,
        radius: 6,
        color: "#38bdf8",
        value: enemy.xpValue,
        createdAt: performance.now(),
        lifetime: 35000,
      });

      // Special powerup drop chances
      const roll = Math.random();
      if (roll < 0.08) {
        // Health Pack
        s.drops.push({
          id: Math.random(),
          type: "HEALTH",
          x: enemy.x + (Math.random() * 20 - 10),
          y: enemy.y + (Math.random() * 20 - 10),
          radius: 9,
          color: "#22c55e",
          value: 30,
          createdAt: performance.now(),
          lifetime: 25000,
        });
      } else if (roll < 0.14) {
        // Shield Battery
        s.drops.push({
          id: Math.random(),
          type: "SHIELD",
          x: enemy.x + (Math.random() * 20 - 10),
          y: enemy.y + (Math.random() * 20 - 10),
          radius: 9,
          color: "#06b6d4",
          value: 35,
          createdAt: performance.now(),
          lifetime: 25000,
        });
      } else if (roll < 0.2) {
        // Ammo
        s.drops.push({
          id: Math.random(),
          type: "AMMO",
          x: enemy.x + (Math.random() * 20 - 10),
          y: enemy.y + (Math.random() * 20 - 10),
          radius: 8,
          color: "#f59e0b",
          value: 1,
          createdAt: performance.now(),
          lifetime: 25000,
        });
      } else if (roll < 0.23) {
        // Speed Boost
        s.drops.push({
          id: Math.random(),
          type: "SPEED",
          x: enemy.x,
          y: enemy.y,
          radius: 10,
          color: "#eab308",
          value: 8,
          createdAt: performance.now(),
          lifetime: 20000,
        });
      } else if (roll < 0.26) {
        // Quad Damage
        s.drops.push({
          id: Math.random(),
          type: "QUAD_DAMAGE",
          x: enemy.x,
          y: enemy.y,
          radius: 11,
          color: "#ec4899",
          value: 6,
          createdAt: performance.now(),
          lifetime: 20000,
        });
      } else if (roll < 0.28) {
        // Overdrive Nuke
        s.drops.push({
          id: Math.random(),
          type: "OVERDRIVE",
          x: enemy.x,
          y: enemy.y,
          radius: 12,
          color: "#ef4444",
          value: 1,
          createdAt: performance.now(),
          lifetime: 20000,
        });
      }
    };

    const collectDrop = (drop: DropItem) => {
      const s = stateRef.current;
      sound.playPowerup();

      switch (drop.type) {
        case "XP":
          addXP(drop.value);
          break;
        case "HEALTH":
          s.player.health = Math.min(s.player.maxHealth, s.player.health + drop.value);
          s.floatingTexts.push({
            id: Math.random(),
            x: s.player.x,
            y: s.player.y - 30,
            text: `+${drop.value} HP`,
            color: "#22c55e",
            size: 16,
            alpha: 1,
            vy: -30,
            lifetime: 1.2,
          });
          break;
        case "SHIELD":
          s.player.shield = Math.min(s.player.maxShield, s.player.shield + drop.value);
          s.floatingTexts.push({
            id: Math.random(),
            x: s.player.x,
            y: s.player.y - 30,
            text: `+${drop.value} SHIELD`,
            color: "#06b6d4",
            size: 16,
            alpha: 1,
            vy: -30,
            lifetime: 1.2,
          });
          break;
        case "AMMO":
          Object.keys(s.ammo).forEach((wKey) => {
            const key = wKey as WeaponType;
            if (s.weapons[key].ammoMax < 999999) {
              s.ammo[key] = s.weapons[key].ammoMax;
            }
          });
          s.floatingTexts.push({
            id: Math.random(),
            x: s.player.x,
            y: s.player.y - 30,
            text: "AMMO RESTOCKED!",
            color: "#f59e0b",
            size: 16,
            alpha: 1,
            vy: -30,
            lifetime: 1.2,
          });
          break;
        case "SPEED":
          s.player.speedBoostTimer = drop.value;
          break;
        case "QUAD_DAMAGE":
          s.player.quadDamageTimer = drop.value;
          triggerScreenShake(6);
          break;
        case "OVERDRIVE":
          // Clear standard enemies
          triggerScreenShake(14);
          sound.playExplosion(true);
          s.enemies.forEach((en) => {
            if (en.type !== "BOSS") {
              en.health = 0;
            } else {
              en.health -= 350;
            }
          });
          s.floatingTexts.push({
            id: Math.random(),
            x: s.player.x,
            y: s.player.y - 50,
            text: "EMP OVERDRIVE DETONATED!",
            color: "#ef4444",
            size: 20,
            alpha: 1,
            vy: -40,
            lifetime: 2.0,
          });
          break;
      }
    };

    // --- RENDER SCENE ---
    const renderScene = (
      context: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      const s = stateRef.current;

      // Clear full screen
      context.fillStyle = "#09090b";
      context.fillRect(0, 0, width, height);

      // Save canvas state for camera transforms
      context.save();

      // Camera centering + screen shake offset
      const offsetX = width / 2 - s.camera.x + s.screenShake.x;
      const offsetY = height / 2 - s.camera.y + s.screenShake.y;
      context.translate(offsetX, offsetY);

      // 1. Draw Arena Floor & Grid
      context.fillStyle = "#0d1117";
      context.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Grid lines
      context.lineWidth = 1;
      context.strokeStyle = "rgba(56, 189, 248, 0.07)";
      const gridSize = 80;
      for (let x = 0; x <= ARENA_WIDTH; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, ARENA_HEIGHT);
        context.stroke();
      }
      for (let y = 0; y <= ARENA_HEIGHT; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(ARENA_WIDTH, y);
        context.stroke();
      }

      // Glowing Arena Perimeter
      context.lineWidth = 6;
      context.strokeStyle = "#38bdf8";
      context.shadowColor = "#38bdf8";
      context.shadowBlur = 18;
      context.strokeRect(4, 4, ARENA_WIDTH - 8, ARENA_HEIGHT - 8);
      context.shadowBlur = 0;

      // 2. Draw Dead Splatters & Background Particles
      for (let i = 0; i < s.particles.length; i++) {
        const p = s.particles[i];
        context.save();
        context.globalAlpha = p.alpha;
        context.fillStyle = p.color;
        context.beginPath();
        context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      // 3. Draw Drops
      for (let i = 0; i < s.drops.length; i++) {
        const drop = s.drops[i];
        context.save();
        context.fillStyle = drop.color;
        context.shadowColor = drop.color;
        context.shadowBlur = 12;

        context.beginPath();
        if (drop.type === "XP") {
          // Diamond shape
          context.moveTo(drop.x, drop.y - drop.radius);
          context.lineTo(drop.x + drop.radius, drop.y);
          context.lineTo(drop.x, drop.y + drop.radius);
          context.lineTo(drop.x - drop.radius, drop.y);
        } else {
          // Circular orb
          context.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        }
        context.closePath();
        context.fill();
        context.restore();
      }

      // 4. Draw Bullets
      for (let i = 0; i < s.bullets.length; i++) {
        const b = s.bullets[i];
        context.save();
        context.fillStyle = b.color;
        context.shadowColor = b.glowColor;
        context.shadowBlur = 10;
        context.beginPath();
        context.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      // 5. Draw Enemies
      for (let i = 0; i < s.enemies.length; i++) {
        const enemy = s.enemies[i];
        context.save();

        // Enemy body glow
        context.shadowColor = enemy.color;
        context.shadowBlur = 12;
        context.fillStyle = enemy.color;

        // Shape based on type
        context.beginPath();
        if (enemy.type === "STALKER") {
          // Triangle
          const angle = Math.atan2(s.player.y - enemy.y, s.player.x - enemy.x);
          context.translate(enemy.x, enemy.y);
          context.rotate(angle);
          context.moveTo(enemy.radius * 1.3, 0);
          context.lineTo(-enemy.radius, -enemy.radius * 0.9);
          context.lineTo(-enemy.radius, enemy.radius * 0.9);
          context.closePath();
        } else if (enemy.type === "BRUTE") {
          // Octagon/Square
          context.rect(
            enemy.x - enemy.radius,
            enemy.y - enemy.radius,
            enemy.radius * 2,
            enemy.radius * 2
          );
        } else {
          // Circle (Crawler / Boss / Spitter)
          context.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        }
        context.fill();

        // Enemy Health Bar
        if (enemy.health < enemy.maxHealth) {
          const barW = enemy.radius * 2.2;
          const barH = 4;
          const barX = enemy.x - barW / 2;
          const barY = enemy.y - enemy.radius - 10;
          const hpRatio = Math.max(0, enemy.health / enemy.maxHealth);

          context.shadowBlur = 0;
          context.fillStyle = "rgba(0,0,0,0.6)";
          context.fillRect(barX, barY, barW, barH);
          context.fillStyle = "#22c55e";
          context.fillRect(barX, barY, barW * hpRatio, barH);
        }

        context.restore();
      }

      // 6. Draw Player
      context.save();
      context.translate(s.player.x, s.player.y);
      context.rotate(s.player.angle);

      // Dash or Quad damage aura
      if (s.player.quadDamageTimer > 0) {
        context.shadowColor = "#ec4899";
        context.shadowBlur = 24;
      } else if (s.player.isDashing) {
        context.shadowColor = "#38bdf8";
        context.shadowBlur = 24;
      } else {
        context.shadowColor = "#38bdf8";
        context.shadowBlur = 12;
      }

      // Gun Barrel
      context.fillStyle = "#94a3b8";
      const curW = s.weapons[s.activeWeapon];
      context.fillRect(10, -3.5, 22, 7);

      // Player Body (Cyber commando chassis)
      context.fillStyle = "#0284c7";
      context.beginPath();
      context.arc(0, 0, s.player.radius, 0, Math.PI * 2);
      context.fill();

      // Core visor / Cockpit
      context.fillStyle = curW.color;
      context.beginPath();
      context.arc(4, 0, 7, 0, Math.PI * 2);
      context.fill();

      // Shield Ring
      if (s.player.shield > 0) {
        const shieldRatio = s.player.shield / s.player.maxShield;
        context.lineWidth = 3;
        context.strokeStyle = `rgba(6, 182, 212, ${0.4 + shieldRatio * 0.6})`;
        context.shadowColor = "#06b6d4";
        context.shadowBlur = 10;
        context.beginPath();
        context.arc(0, 0, s.player.radius + 6, 0, Math.PI * 2);
        context.stroke();
      }

      context.restore();

      // 7. Draw Floating Combat Text
      for (let i = 0; i < s.floatingTexts.length; i++) {
        const ft = s.floatingTexts[i];
        context.save();
        context.globalAlpha = ft.alpha;
        context.font = `bold ${ft.size}px monospace`;
        context.fillStyle = ft.color;
        context.textAlign = "center";
        context.shadowColor = ft.color;
        context.shadowBlur = 6;
        context.fillText(ft.text, ft.x, ft.y);
        context.restore();
      }

      // Restore camera state
      context.restore();

      // Crosshair Cursor in Screen Space
      context.save();
      context.strokeStyle = curW.color;
      context.lineWidth = 1.8;
      context.shadowColor = curW.color;
      context.shadowBlur = 8;
      const mx = s.mouse.x;
      const my = s.mouse.y;
      context.beginPath();
      context.arc(mx, my, 8, 0, Math.PI * 2);
      context.moveTo(mx - 14, my);
      context.lineTo(mx - 8, my);
      context.moveTo(mx + 8, my);
      context.lineTo(mx + 14, my);
      context.moveTo(mx, my - 14);
      context.lineTo(mx, my - 8);
      context.moveTo(mx, my + 8);
      context.lineTo(mx, my + 14);
      context.stroke();
      context.restore();
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [
    gameState,
    autoFire,
    screenShakeEnabled,
    onGameOver,
    onLevelUp,
    onWaveComplete,
    onStatsUpdate,
    onWeaponChange,
    mobileInputRef,
    mobileControls,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block w-full h-full cursor-none select-none touch-none"
    />
  );
}
