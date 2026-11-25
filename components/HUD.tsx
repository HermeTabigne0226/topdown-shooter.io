"use client";

import React from "react";
import { WeaponConfig, WeaponType } from "@/types/game";
import {
  Volume2,
  VolumeX,
  Music,
  Pause,
  Zap,
  Flame,
  Shield,
  Heart,
  RotateCw,
} from "lucide-react";

interface HUDProps {
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
  onSelectWeapon: (type: WeaponType) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onPause: () => void;
  isMuted: boolean;
  isMusicPlaying: boolean;
}

export default function HUD({
  health,
  maxHealth,
  shield,
  maxShield,
  ammo,
  maxAmmo,
  isReloading,
  reloadProgress,
  score,
  combo,
  level,
  xp,
  xpToNextLevel,
  wave,
  activeWeapon,
  weapons,
  dashReady,
  activePowerup,
  onSelectWeapon,
  onToggleMute,
  onToggleMusic,
  onPause,
  isMuted,
  isMusicPlaying,
}: HUDProps) {
  const hpPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const shieldPct = Math.max(0, Math.min(100, (shield / maxShield) * 100));
  const xpPct = Math.max(0, Math.min(100, (xp / xpToNextLevel) * 100));

  const weaponList: WeaponType[] = ["PISTOL", "SHOTGUN", "RIFLE", "PLASMA", "RAILGUN"];

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* --- TOP BAR --- */}
      <div className="flex items-start justify-between">
        {/* Left: Wave & Score */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-cyan-500/40 bg-zinc-950/80 px-3.5 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)] backdrop-blur-md">
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">
                WAVE {wave}
              </span>
            </div>
            {combo > 1 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-950/70 px-3 py-1 shadow-[0_0_15px_rgba(245,158,11,0.3)] backdrop-blur-md animate-pulse">
                <Flame className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  COMBO x{combo}
                </span>
              </div>
            )}
            {activePowerup && (
              <div className="rounded-lg border border-pink-500/50 bg-pink-950/70 px-3 py-1 shadow-[0_0_15px_rgba(236,72,153,0.3)] backdrop-blur-md">
                <span className="text-xs font-bold text-pink-300 animate-pulse">
                  {activePowerup}
                </span>
              </div>
            )}
          </div>
          <div className="font-mono text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            SCORE: {score.toLocaleString()}
          </div>
        </div>

        {/* Right: Controls & Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleMusic}
            title="Toggle Synth Music"
            className={`rounded-lg border p-2 backdrop-blur-md transition-all ${
              isMusicPlaying
                ? "border-cyan-500/60 bg-cyan-950/70 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Music className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleMute}
            title={isMuted ? "Unmute SFX" : "Mute SFX"}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-400 backdrop-blur-md transition-all hover:text-zinc-200"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onPause}
            title="Pause Game (Esc)"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-semibold text-zinc-200 backdrop-blur-md transition-all hover:border-zinc-500 hover:bg-zinc-800"
          >
            <Pause className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PAUSE</span>
          </button>
        </div>
      </div>

      {/* --- BOTTOM SECTION --- */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {/* Health & Shield Bars */}
          <div className="flex w-64 flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/85 p-3 shadow-xl backdrop-blur-md">
            {/* Health Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1 text-red-400">
                  <Heart className="h-3.5 w-3.5 fill-red-500/20" /> HP
                </span>
                <span className="font-mono text-zinc-300">
                  {health} / {maxHealth}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            {/* Shield Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Shield className="h-3.5 w-3.5 fill-cyan-500/20" /> SHIELD
                </span>
                <span className="font-mono text-zinc-300">
                  {shield} / {maxShield}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-300 transition-all duration-150 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                  style={{ width: `${shieldPct}%` }}
                />
              </div>
            </div>

            {/* Dash Cooldown Indicator */}
            <div className="mt-1 flex items-center justify-between border-t border-zinc-800/60 pt-1.5 text-[11px] font-medium text-zinc-400">
              <span className="flex items-center gap-1">
                <Zap className={`h-3 w-3 ${dashReady ? "text-amber-400" : "text-zinc-600"}`} />
                DASH (SPACE / SHIFT)
              </span>
              <span className={dashReady ? "font-bold text-amber-400" : "text-zinc-500"}>
                {dashReady ? "READY" : "CHARGING"}
              </span>
            </div>
          </div>

          {/* Weapon Selector Bar */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-zinc-800/80 bg-zinc-950/85 p-2 shadow-xl backdrop-blur-md">
            {weaponList.map((type, idx) => {
              const w = weapons[type];
              const isSelected = activeWeapon === type;
              return (
                <button
                  key={type}
                  disabled={!w.unlocked}
                  onClick={() => onSelectWeapon(type)}
                  className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 transition-all ${
                    isSelected
                      ? "border border-cyan-400 bg-cyan-950/60 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                      : w.unlocked
                      ? "border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/70"
                      : "opacity-35 cursor-not-allowed border border-transparent bg-zinc-900/30"
                  }`}
                >
                  <span className="text-[10px] font-mono text-zinc-400">[{idx + 1}]</span>
                  <span
                    className="text-xs font-bold truncate max-w-[80px]"
                    style={{ color: w.unlocked ? w.color : "#71717a" }}
                  >
                    {w.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ammo & Reload Counter */}
          <div className="flex flex-col items-end rounded-xl border border-zinc-800/80 bg-zinc-950/85 px-4 py-3 shadow-xl backdrop-blur-md min-w-[140px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {weapons[activeWeapon].name}
            </span>
            {isReloading ? (
              <div className="flex items-center gap-2 mt-1">
                <RotateCw className="h-4 w-4 animate-spin text-amber-400" />
                <span className="font-mono text-xs font-bold text-amber-300">
                  RELOADING ({Math.round(reloadProgress * 100)}%)
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-3xl font-black text-white">
                  {maxAmmo >= 999999 ? "∞" : ammo}
                </span>
                {maxAmmo < 999999 && (
                  <span className="text-sm font-semibold text-zinc-500">
                    / {maxAmmo}
                  </span>
                )}
              </div>
            )}
            <span className="text-[10px] text-zinc-500 mt-0.5">[R] MANUAL RELOAD</span>
          </div>
        </div>

        {/* Global XP & Level Progress Bar */}
        <div className="flex flex-col gap-1 w-full">
          <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 px-1">
            <span className="font-bold text-amber-400">LVL {level}</span>
            <span>XP: {xp} / {xpToNextLevel}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900/90 border border-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-200 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
