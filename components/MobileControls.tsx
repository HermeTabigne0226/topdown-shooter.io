"use client";

import React, { useRef, useState } from "react";
import { MobileInputState } from "@/types/game";
import { Zap, RotateCw } from "lucide-react";

interface MobileControlsProps {
  mobileInputRef: React.MutableRefObject<MobileInputState>;
  dashReady: boolean;
  canReload: boolean;
  isReloading: boolean;
}

interface StickOffset {
  x: number;
  y: number;
}

const MAX_STICK_RADIUS = 40;
const AIM_DEADZONE = 0.18;

export default function MobileControls({
  mobileInputRef,
  dashReady,
  canReload,
  isReloading,
}: MobileControlsProps) {
  const [leftKnob, setLeftKnob] = useState<StickOffset>({ x: 0, y: 0 });
  const [rightKnob, setRightKnob] = useState<StickOffset>({ x: 0, y: 0 });

  const leftOriginRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const rightOriginRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const computeVector = (dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return { kx: 0, ky: 0, nx: 0, ny: 0, mag: 0 };
    const clampedDist = Math.min(dist, MAX_STICK_RADIUS);
    const scale = clampedDist / dist;
    const kx = dx * scale;
    const ky = dy * scale;
    return {
      kx,
      ky,
      nx: kx / MAX_STICK_RADIUS,
      ny: ky / MAX_STICK_RADIUS,
      mag: clampedDist / MAX_STICK_RADIUS,
    };
  };

  // Left (Move) Stick Handlers
  const handleLeftDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    leftOriginRef.current = { x: cx, y: cy, pointerId: e.pointerId };
    const { kx, ky, nx, ny } = computeVector(e.clientX - cx, e.clientY - cy);
    setLeftKnob({ x: kx, y: ky });
    mobileInputRef.current.moveX = nx;
    mobileInputRef.current.moveY = ny;
  };

  const handleLeftMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!leftOriginRef.current || leftOriginRef.current.pointerId !== e.pointerId) return;
    const { kx, ky, nx, ny } = computeVector(
      e.clientX - leftOriginRef.current.x,
      e.clientY - leftOriginRef.current.y
    );
    setLeftKnob({ x: kx, y: ky });
    mobileInputRef.current.moveX = nx;
    mobileInputRef.current.moveY = ny;
  };

  const handleLeftUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!leftOriginRef.current || leftOriginRef.current.pointerId !== e.pointerId) return;
    leftOriginRef.current = null;
    setLeftKnob({ x: 0, y: 0 });
    mobileInputRef.current.moveX = 0;
    mobileInputRef.current.moveY = 0;
  };

  // Right (Aim + Fire) Stick Handlers
  const handleRightDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rightOriginRef.current = { x: cx, y: cy, pointerId: e.pointerId };
    const { kx, ky, nx, ny, mag } = computeVector(e.clientX - cx, e.clientY - cy);
    setRightKnob({ x: kx, y: ky });
    mobileInputRef.current.isAiming = true;
    mobileInputRef.current.aimX = nx;
    mobileInputRef.current.aimY = ny;
    mobileInputRef.current.isShooting = mag >= AIM_DEADZONE;
  };

  const handleRightMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rightOriginRef.current || rightOriginRef.current.pointerId !== e.pointerId) return;
    const { kx, ky, nx, ny, mag } = computeVector(
      e.clientX - rightOriginRef.current.x,
      e.clientY - rightOriginRef.current.y
    );
    setRightKnob({ x: kx, y: ky });
    mobileInputRef.current.isAiming = true;
    mobileInputRef.current.aimX = nx;
    mobileInputRef.current.aimY = ny;
    mobileInputRef.current.isShooting = mag >= AIM_DEADZONE;
  };

  const handleRightUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rightOriginRef.current || rightOriginRef.current.pointerId !== e.pointerId) return;
    rightOriginRef.current = null;
    setRightKnob({ x: 0, y: 0 });
    mobileInputRef.current.isAiming = false;
    mobileInputRef.current.isShooting = false;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none touch-none">
      {/* Left Virtual Stick: Movement */}
      <div
        onPointerDown={handleLeftDown}
        onPointerMove={handleLeftMove}
        onPointerUp={handleLeftUp}
        onPointerCancel={handleLeftUp}
        className="pointer-events-auto absolute bottom-5 left-5 sm:bottom-8 sm:left-8 flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-2 border-cyan-500/35 bg-zinc-950/45 backdrop-blur-sm touch-none"
      >
        <div className="absolute inset-3 rounded-full border border-cyan-400/15" />
        <div
          className="h-12 w-12 rounded-full border-2 border-cyan-300 bg-cyan-500/40 shadow-[0_0_16px_rgba(34,211,238,0.5)] transition-transform duration-75"
          style={{
            transform: `translate(${leftKnob.x}px, ${leftKnob.y}px)`,
          }}
        />
        <span className="pointer-events-none absolute -bottom-5 text-[9px] font-mono font-bold tracking-widest text-cyan-400/70">
          MOVE
        </span>
      </div>

      {/* Right Action Buttons (Dash + Reload) */}
      <div className="pointer-events-auto absolute bottom-36 right-5 sm:bottom-44 sm:right-8 flex items-center gap-2.5 touch-none">
        {canReload && (
          <button
            type="button"
            disabled={isReloading}
            onPointerDown={(e) => {
              e.stopPropagation();
              mobileInputRef.current.reloadRequested = true;
            }}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all active:scale-95 ${
              isReloading
                ? "border-amber-500/60 bg-amber-950/60 text-amber-300"
                : "border-zinc-500/60 bg-zinc-900/75 text-zinc-200 active:border-cyan-400"
            }`}
            aria-label="Reload"
          >
            <RotateCw className={`h-5 w-5 ${isReloading ? "animate-spin" : ""}`} />
          </button>
        )}

        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            mobileInputRef.current.dashRequested = true;
          }}
          className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all active:scale-95 ${
            dashReady
              ? "border-amber-400/80 bg-amber-500/25 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
              : "border-zinc-700/70 bg-zinc-900/60 text-zinc-500"
          }`}
          aria-label="Dash"
        >
          <Zap className="h-5 w-5" />
          <span className="text-[8px] font-mono font-bold tracking-wider">DASH</span>
        </button>
      </div>

      {/* Right Virtual Stick: Aim & Shoot */}
      <div
        onPointerDown={handleRightDown}
        onPointerMove={handleRightMove}
        onPointerUp={handleRightUp}
        onPointerCancel={handleRightUp}
        className="pointer-events-auto absolute bottom-5 right-5 sm:bottom-8 sm:right-8 flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-2 border-rose-500/35 bg-zinc-950/45 backdrop-blur-sm touch-none"
      >
        <div className="absolute inset-3 rounded-full border border-rose-400/15" />
        <div
          className="h-12 w-12 rounded-full border-2 border-rose-300 bg-rose-500/40 shadow-[0_0_16px_rgba(244,63,94,0.5)] transition-transform duration-75"
          style={{
            transform: `translate(${rightKnob.x}px, ${rightKnob.y}px)`,
          }}
        />
        <span className="pointer-events-none absolute -bottom-5 text-[9px] font-mono font-bold tracking-widest text-rose-400/70">
          AIM / FIRE
        </span>
      </div>
    </div>
  );
}
