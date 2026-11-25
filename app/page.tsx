"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import GameCanvas from "@/components/GameCanvas";
import HUD from "@/components/HUD";
import StartScreen from "@/components/StartScreen";
import UpgradeModal from "@/components/UpgradeModal";
import PauseModal from "@/components/PauseModal";
import GameOverModal from "@/components/GameOverModal";
import MobileControls from "@/components/MobileControls";
import {
  GameSettings,
  GameState,
  MobileInputState,
  PlayerStats,
  UpgradeOption,
  WeaponConfig,
  WeaponType,
} from "@/types/game";
import { sound } from "@/lib/audio";
import { DEFAULT_WEAPONS } from "@/lib/weapons";
import { getRandomUpgrades } from "@/lib/upgrades";

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>("START");
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>("PISTOL");
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [restartTrigger, setRestartTrigger] = useState(0);

  // Game Settings
  const [settings, setSettings] = useState<GameSettings>({
    sfxVolume: 0.5,
    musicVolume: 0.35,
    screenShakeEnabled: true,
    autoFire: false,
    mobileControls: false,
  });

  // Auto-detect touch / mobile devices on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isTouch =
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;
      if (isTouch) {
        setSettings((prev) => ({ ...prev, mobileControls: true }));
      }
    }
  }, []);

  // End game stats
  const [finalStats, setFinalStats] = useState({
    score: 0,
    wave: 1,
    enemiesKilled: 0,
  });

  // HUD stats state
  const [hudStats, setHudStats] = useState({
    health: 100,
    maxHealth: 100,
    shield: 60,
    maxShield: 60,
    ammo: 999999,
    maxAmmo: 999999,
    isReloading: false,
    reloadProgress: 0,
    score: 0,
    combo: 1,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    wave: 1,
    activeWeapon: "PISTOL" as WeaponType,
    weapons: { ...DEFAULT_WEAPONS },
    dashReady: true,
    activePowerup: null as string | null,
  });

  // Mutable refs shared with canvas loop
  const playerStatsRef = useRef<PlayerStats | null>(null);
  const weaponsRef = useRef<Record<WeaponType, WeaponConfig>>({ ...DEFAULT_WEAPONS });
  const mobileInputRef = useRef<MobileInputState>({
    moveX: 0,
    moveY: 0,
    aimX: 0,
    aimY: 0,
    isAiming: false,
    isShooting: false,
    dashRequested: false,
    reloadRequested: false,
  });

  // Start game handler
  const handleStartGame = () => {
    setGameState("PLAYING");
    sound.startMusic();
    setIsMusicPlaying(true);
  };

  // Pause toggle
  const handlePause = useCallback(() => {
    setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : prev));
  }, []);

  const handleResume = useCallback(() => {
    setGameState("PLAYING");
  }, []);

  const handleRestart = () => {
    mobileInputRef.current = {
      moveX: 0,
      moveY: 0,
      aimX: 0,
      aimY: 0,
      isAiming: false,
      isShooting: false,
      dashRequested: false,
      reloadRequested: false,
    };
    setRestartTrigger((prev) => prev + 1);
    setActiveWeapon("PISTOL");
    setUpgradeOptions([]);
    setGameState("PLAYING");
    if (!isMuted) {
      sound.startMusic();
      setIsMusicPlaying(true);
    }
  };

  // Level Up / Perk selection
  const handleLevelUp = useCallback(() => {
    const perks = getRandomUpgrades(3);
    setUpgradeOptions(perks);
    setGameState("UPGRADING");
  }, []);

  const handleSelectUpgrade = (option: UpgradeOption) => {
    if (playerStatsRef.current && weaponsRef.current) {
      option.apply(playerStatsRef.current, weaponsRef.current);
    }
    sound.playPowerup();
    setGameState("PLAYING");
  };

  // Wave complete handler
  const handleWaveComplete = useCallback((_wave: number) => {
    // Chance to grant an upgrade on completing a wave
    const perks = getRandomUpgrades(3);
    setUpgradeOptions(perks);
    setGameState("UPGRADING");
  }, []);

  // Game over handler
  const handleGameOver = useCallback(
    (score: number, wave: number, enemiesKilled: number) => {
      setFinalStats({ score, wave, enemiesKilled });
      setGameState("GAMEOVER");
      sound.stopMusic();
      setIsMusicPlaying(false);
    },
    []
  );

  // Settings update
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.sfxVolume !== undefined) sound.setSfxVolume(newSettings.sfxVolume);
      if (newSettings.musicVolume !== undefined) sound.setMusicVolume(newSettings.musicVolume);
      return updated;
    });
  };

  // Audio toggles
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (muted) setIsMusicPlaying(false);
  };

  const handleToggleMusic = () => {
    const playing = sound.toggleMusic();
    setIsMusicPlaying(playing);
  };

  // Global pause hotkey
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        if (gameState === "PLAYING") {
          handlePause();
        } else if (gameState === "PAUSED") {
          handleResume();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, handlePause, handleResume]);

  return (
    <main className="relative w-screen h-dvh overflow-hidden bg-black select-none touch-none">
      {/* 2D HTML5 Canvas Game Engine */}
      <GameCanvas
        gameState={gameState}
        restartTrigger={restartTrigger}
        onGameOver={handleGameOver}
        onLevelUp={handleLevelUp}
        onWaveComplete={handleWaveComplete}
        onStatsUpdate={setHudStats}
        autoFire={settings.autoFire}
        screenShakeEnabled={settings.screenShakeEnabled}
        activeWeapon={activeWeapon}
        onWeaponChange={setActiveWeapon}
        playerStatsRef={playerStatsRef}
        weaponsRef={weaponsRef}
        mobileInputRef={mobileInputRef}
        mobileControls={settings.mobileControls}
      />

      {/* Cyberpunk HUD */}
      {gameState !== "START" && (
        <HUD
          health={hudStats.health}
          maxHealth={hudStats.maxHealth}
          shield={hudStats.shield}
          maxShield={hudStats.maxShield}
          ammo={hudStats.ammo}
          maxAmmo={hudStats.maxAmmo}
          isReloading={hudStats.isReloading}
          reloadProgress={hudStats.reloadProgress}
          score={hudStats.score}
          combo={hudStats.combo}
          level={hudStats.level}
          xp={hudStats.xp}
          xpToNextLevel={hudStats.xpToNextLevel}
          wave={hudStats.wave}
          activeWeapon={activeWeapon}
          weapons={hudStats.weapons}
          dashReady={hudStats.dashReady}
          activePowerup={hudStats.activePowerup}
          onSelectWeapon={setActiveWeapon}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onPause={handlePause}
          isMuted={isMuted}
          isMusicPlaying={isMusicPlaying}
          mobileControls={settings.mobileControls}
        />
      )}

      {/* Mobile Touch Joysticks & Action Buttons */}
      {gameState === "PLAYING" && settings.mobileControls && (
        <MobileControls
          mobileInputRef={mobileInputRef}
          dashReady={hudStats.dashReady}
          canReload={hudStats.maxAmmo < 999999 && hudStats.ammo < hudStats.maxAmmo}
          isReloading={hudStats.isReloading}
        />
      )}

      {/* Start Screen */}
      {gameState === "START" && <StartScreen onStart={handleStartGame} />}

      {/* Upgrade / Perk Selection Modal */}
      {gameState === "UPGRADING" && (
        <UpgradeModal options={upgradeOptions} onSelect={handleSelectUpgrade} />
      )}

      {/* Pause Menu Modal */}
      {gameState === "PAUSED" && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Game Over Screen */}
      {gameState === "GAMEOVER" && (
        <GameOverModal
          score={finalStats.score}
          wave={finalStats.wave}
          enemiesKilled={finalStats.enemiesKilled}
          onRestart={handleRestart}
        />
      )}
    </main>
  );
}
