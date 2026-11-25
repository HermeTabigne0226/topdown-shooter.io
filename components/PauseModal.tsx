"use client";

import React from "react";
import { GameSettings } from "@/types/game";
import { Play, RotateCcw, Volume2, Music, Sparkles } from "lucide-react";

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export default function PauseModal({
  onResume,
  onRestart,
  settings,
  onUpdateSettings,
}: PauseModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            SIMULATION SUSPENDED
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight mt-1">
            GAME PAUSED
          </h2>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 font-bold text-zinc-950 transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            RESUME COMBAT
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 py-3 font-semibold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            RESTART MISSION
          </button>
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-3.5 border-t border-zinc-800/80 pt-5">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            OPTIONS
          </div>

          {/* Screen Shake */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-zinc-300">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Screen Shake
            </span>
            <input
              type="checkbox"
              checked={settings.screenShakeEnabled}
              onChange={(e) =>
                onUpdateSettings({ screenShakeEnabled: e.target.checked })
              }
              className="h-4 w-4 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Auto Fire */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-zinc-300">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Auto-Fire Weapons
            </span>
            <input
              type="checkbox"
              checked={settings.autoFire}
              onChange={(e) => onUpdateSettings({ autoFire: e.target.checked })}
              className="h-4 w-4 rounded accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> SFX Volume
              </span>
              <span>{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) =>
                onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })
              }
              className="h-1.5 w-full rounded-lg accent-cyan-500 cursor-pointer bg-zinc-800"
            />
          </div>

          {/* Music Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-cyan-400" /> Music Volume
              </span>
              <span>{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) =>
                onUpdateSettings({ musicVolume: parseFloat(e.target.value) })
              }
              className="h-1.5 w-full rounded-lg accent-cyan-500 cursor-pointer bg-zinc-800"
            />
          </div>
        </div>

        {/* Controls recap */}
        <div className="mt-5 border-t border-zinc-800/80 pt-4 text-[11px] text-zinc-500 leading-relaxed">
          <p><strong className="text-zinc-400">WASD / Arrows:</strong> Move Commando</p>
          <p><strong className="text-zinc-400">Mouse:</strong> Aim & Shoot</p>
          <p><strong className="text-zinc-400">Space / Shift:</strong> Tactical Dash</p>
          <p><strong className="text-zinc-400">R:</strong> Manual Reload | <strong className="text-zinc-400">1-5 / Scroll:</strong> Switch Weapon</p>
        </div>
      </div>
    </div>
  );
}
