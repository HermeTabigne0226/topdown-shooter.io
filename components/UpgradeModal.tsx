"use client";

import React from "react";
import { UpgradeOption } from "@/types/game";
import {
  ShieldPlus,
  Shield,
  Zap,
  Flame,
  FastForward,
  Disc,
  Crosshair,
  Magnet,
  Repeat,
  Sparkles,
} from "lucide-react";

interface UpgradeModalProps {
  options: UpgradeOption[];
  onSelect: (option: UpgradeOption) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  ShieldPlus: <ShieldPlus className="h-8 w-8 text-emerald-400" />,
  Shield: <Shield className="h-8 w-8 text-cyan-400" />,
  Zap: <Zap className="h-8 w-8 text-amber-400" />,
  Flame: <Flame className="h-8 w-8 text-rose-400" />,
  FastForward: <FastForward className="h-8 w-8 text-purple-400" />,
  Disc: <Disc className="h-8 w-8 text-blue-400" />,
  Crosshair: <Crosshair className="h-8 w-8 text-pink-400" />,
  Magnet: <Magnet className="h-8 w-8 text-indigo-400" />,
  Repeat: <Repeat className="h-8 w-8 text-orange-400" />,
  Sparkles: <Sparkles className="h-8 w-8 text-yellow-400" />,
};

const RARITY_STYLES = {
  COMMON: {
    border: "border-cyan-500/30 hover:border-cyan-400",
    bg: "bg-zinc-900/90 hover:bg-zinc-800/90",
    tag: "text-cyan-400 bg-cyan-950/60 border-cyan-800",
    glow: "hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]",
  },
  RARE: {
    border: "border-purple-500/40 hover:border-purple-400",
    bg: "bg-zinc-900/90 hover:bg-zinc-800/90",
    tag: "text-purple-400 bg-purple-950/60 border-purple-800",
    glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]",
  },
  EPIC: {
    border: "border-amber-500/40 hover:border-amber-400",
    bg: "bg-zinc-900/90 hover:bg-zinc-800/90",
    tag: "text-amber-400 bg-amber-950/60 border-amber-800",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]",
  },
  LEGENDARY: {
    border: "border-rose-500/50 hover:border-rose-400",
    bg: "bg-zinc-900/90 hover:bg-zinc-800/90",
    tag: "text-rose-400 bg-rose-950/60 border-rose-800",
    glow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.4)]",
  },
};

export default function UpgradeModal({ options, onSelect }: UpgradeModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="flex flex-col items-center max-w-4xl w-full max-h-[92dvh] overflow-y-auto my-auto py-2">
        <div className="text-center mb-6">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            COMBAT UPGRADE AVAILABLE
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight mt-1">
            CHOOSE YOUR PERK
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Select one technology to integrate into your battle suit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {options.map((option, idx) => {
            const styles = RARITY_STYLES[option.rarity];
            return (
              <button
                key={option.id}
                onClick={() => onSelect(option)}
                className={`group flex flex-col items-start p-5 rounded-2xl border ${styles.border} ${styles.bg} ${styles.glow} transition-all duration-200 text-left cursor-pointer transform hover:-translate-y-1.5`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    {ICON_MAP[option.iconName] || <Sparkles className="h-8 w-8 text-cyan-400" />}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${styles.tag}`}
                  >
                    {option.rarity}
                  </span>
                </div>

                <div className="text-xs font-mono text-zinc-500 mb-1">
                  OPT [{idx + 1}]
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {option.title}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-400 mt-2">
                  {option.description}
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 w-full flex items-center justify-between text-[11px] font-mono text-zinc-500 group-hover:text-cyan-400">
                  <span>INSTALL PROTOCOL</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
