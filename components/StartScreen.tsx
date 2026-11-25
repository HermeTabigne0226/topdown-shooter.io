"use client";

import React, { useEffect, useState } from "react";
import {
  Play,
  Crosshair,
  Zap,
  Shield,
  Volume2,
  Flame,
  Award,
} from "lucide-react";

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = parseInt(localStorage.getItem("cyberstorm_highscore") || "0", 10);
      setHighScore(saved);
    }
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 select-none overflow-y-auto">
      {/* Background neon grid decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center my-auto">
        {/* Title Badges */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-950/50 px-3.5 py-1 text-xs font-mono font-semibold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] mb-4">
          <Zap className="h-3.5 w-3.5 text-cyan-300" />
          TOP-DOWN NEXT.JS ARENA SHOOTER
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]">
          CYBER<span className="text-cyan-400">STORM</span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-md mt-3 leading-relaxed">
          Survive escalating waves of rogue cyber-drones. Level up, unlock devastating futuristic weapons, and dominate the arena.
        </p>

        {highScore > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-1.5 text-xs font-mono text-amber-300">
            <Award className="h-4 w-4 text-amber-400" />
            <span>RECORD HIGH SCORE: <strong className="text-white">{highScore.toLocaleString()}</strong></span>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={onStart}
          className="group relative mt-7 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 px-10 py-4 text-lg font-black tracking-wide text-zinc-950 shadow-[0_0_35px_rgba(6,182,212,0.6)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_50px_rgba(6,182,212,0.9)] cursor-pointer"
        >
          <Play className="h-5 w-5 fill-current transition-transform group-hover:scale-110" />
          DEPLOY TO ARENA
        </button>

        {/* Key Features Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-10">
          <div className="flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <Crosshair className="h-5 w-5 text-cyan-400 mb-1" />
            <span className="text-xs font-bold text-zinc-200">5 Weapons</span>
            <span className="text-[10px] text-zinc-400">Blaster to Railgun</span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <Shield className="h-5 w-5 text-emerald-400 mb-1" />
            <span className="text-xs font-bold text-zinc-200">Recharging Shield</span>
            <span className="text-[10px] text-zinc-400">Regenerates out of fire</span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <Flame className="h-5 w-5 text-amber-400 mb-1" />
            <span className="text-xs font-bold text-zinc-200">Perk Upgrades</span>
            <span className="text-[10px] text-zinc-400">Level-up combat perks</span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <Volume2 className="h-5 w-5 text-purple-400 mb-1" />
            <span className="text-xs font-bold text-zinc-200">Synth Audio</span>
            <span className="text-[10px] text-zinc-400">Procedural SFX & Music</span>
          </div>
        </div>

        {/* Controls Cheatsheet */}
        <div className="mt-8 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 w-full text-left">
          <div className="text-[11px] font-mono font-bold tracking-wider text-zinc-400 uppercase mb-2">
            OPERATIONAL CONTROLS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300 border border-zinc-700">W, A, S, D</kbd>
              <span>Move Commando</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300 border border-zinc-700">Mouse</kbd>
              <span>Aim & Left Click to Shoot</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300 border border-zinc-700">Space / Shift</kbd>
              <span>Tactical Dash (Invulnerable)</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300 border border-zinc-700">R</kbd>
              <span>Manual Reload</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300 border border-zinc-700">1 - 5 / Wheel</kbd>
              <span>Switch Unlocked Weapons</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-cyan-300 border border-zinc-700">Esc / P</kbd>
              <span>Pause Mission</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
