"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, Trophy, Skull, Crosshair } from "lucide-react";

interface GameOverModalProps {
  score: number;
  wave: number;
  enemiesKilled: number;
  onRestart: () => void;
}

export default function GameOverModal({
  score,
  wave,
  enemiesKilled,
  onRestart,
}: GameOverModalProps) {
  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = parseInt(localStorage.getItem("cyberstorm_highscore") || "0", 10);
      if (score > saved) {
        localStorage.setItem("cyberstorm_highscore", score.toString());
        setHighScore(score);
        setIsNewRecord(true);
        // Confetti burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setHighScore(saved);
      }
    }
  }, [score]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="flex flex-col w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-rose-950/80 bg-zinc-950/95 p-5 sm:p-6 shadow-2xl text-center">
        <div className="mb-4">
          <span className="text-xs font-mono font-bold tracking-widest text-rose-500 uppercase">
            SIGNAL LOST // TELEMETRY TERMINATED
          </span>
          <h2 className="text-4xl font-black text-rose-500 tracking-tight mt-1">
            MISSION FAILED
          </h2>
        </div>

        {isNewRecord && (
          <div className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/50 bg-amber-950/40 px-4 py-1 text-xs font-bold text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-bounce mx-auto">
            <Trophy className="h-4 w-4 text-amber-400" />
            NEW ALL-TIME RECORD!
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <span className="text-[11px] font-mono text-zinc-500 uppercase">
              FINAL SCORE
            </span>
            <span className="text-2xl font-black font-mono text-white mt-0.5">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <span className="text-[11px] font-mono text-zinc-500 uppercase">
              HIGH SCORE
            </span>
            <span className="text-2xl font-black font-mono text-amber-400 mt-0.5">
              {highScore.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 uppercase">
              <Skull className="h-3 w-3 text-cyan-400" /> WAVES SURVIVED
            </span>
            <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
              {wave}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
            <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 uppercase">
              <Crosshair className="h-3 w-3 text-rose-400" /> HOSTILES SLAIN
            </span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-0.5">
              {enemiesKilled}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 py-3.5 font-bold text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all hover:from-rose-500 hover:to-red-400 cursor-pointer text-sm"
        >
          <RotateCcw className="h-4 w-4" />
          DEPLOY REINFORCEMENTS
        </button>
      </div>
    </div>
  );
}
