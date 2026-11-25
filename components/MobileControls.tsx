"use client";

import React, { useEffect, useRef, useState } from "react";
import { MobileInputState } from "@/types/game";
import { Zap, RotateCw, Crosshair, Move } from "lucide-react";

interface MobileControlsProps {
  mobileInputRef: React.MutableRefObject<MobileInputState>;
  dashReady: boolean;
  canReload: boolean;
  isReloading: boolean;
  showGuide?: boolean;
  onDismissGuide?: () => void;
}

interface ActiveStick {
  originX: number;
  originY: number;
  knobX: number;
  knobY: number;
}

const MAX_STICK_RADIUS = 44;
const AIM_DEADZONE = 0.16;

export default function MobileControls({
  mobileInputRef,
  dashReady,
  canReload,
  isReloading,
  showGuide = false,
  onDismissGuide,
}: MobileControlsProps) {
  const [leftStick, setLeftStick] = useState<ActiveStick | null>(null);
  const [rightStick, setRightStick] = useState<ActiveStick | null>(null);

  const leftOriginRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const rightOriginRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  // Reset mobile movement/aim state if controls unmount (e.g. pause/level-up)
  useEffect(() => {
    const input = mobileInputRef.current;
    return () => {
      input.moveX = 0;
      input.moveY = 0;
      input.isAiming = false;
      input.isShooting = false;
    };
  }, [mobileInputRef]);

  // Auto-dismiss the initial mobile controls instruction after 4.5s
  useEffect(() => {
    if (!showGuide || !onDismissGuide) return;
    const timer = setTimeout(() => {
      onDismissGuide();
    }, 4500);
    return () => clearTimeout(timer);
  }, [showGuide, onDismissGuide]);

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

  // Left Half: Free-floating Movement Stick
  const handleLeftDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showGuide && onDismissGuide) onDismissGuide();
    if (leftOriginRef.current !== null) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    leftOriginRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setLeftStick({ originX: e.clientX, originY: e.clientY, knobX: 0, knobY: 0 });
    mobileInputRef.current.moveX = 0;
    mobileInputRef.current.moveY = 0;
  };

  const handleLeftMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!leftOriginRef.current || leftOriginRef.current.pointerId !== e.pointerId) return;
    const { kx, ky, nx, ny } = computeVector(
      e.clientX - leftOriginRef.current.x,
      e.clientY - leftOriginRef.current.y
    );
    setLeftStick({
      originX: leftOriginRef.current.x,
      originY: leftOriginRef.current.y,
      knobX: kx,
      knobY: ky,
    });
    mobileInputRef.current.moveX = nx;
    mobileInputRef.current.moveY = ny;
  };

  const handleLeftUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!leftOriginRef.current || leftOriginRef.current.pointerId !== e.pointerId) return;
    leftOriginRef.current = null;
    setLeftStick(null);
    mobileInputRef.current.moveX = 0;
    mobileInputRef.current.moveY = 0;
  };

  // Right Half: Free-floating Aim & Shoot Stick
  const handleRightDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showGuide && onDismissGuide) onDismissGuide();
    if (rightOriginRef.current !== null) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    rightOriginRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setRightStick({ originX: e.clientX, originY: e.clientY, knobX: 0, knobY: 0 });
    mobileInputRef.current.isAiming = false;
    mobileInputRef.current.isShooting = false;
  };

  const handleRightMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rightOriginRef.current || rightOriginRef.current.pointerId !== e.pointerId) return;
    const { kx, ky, nx, ny, mag } = computeVector(
      e.clientX - rightOriginRef.current.x,
      e.clientY - rightOriginRef.current.y
    );
    setRightStick({
      originX: rightOriginRef.current.x,
      originY: rightOriginRef.current.y,
      knobX: kx,
      knobY: ky,
    });
    mobileInputRef.current.isAiming = mag >= 0.08;
    mobileInputRef.current.aimX = nx;
    mobileInputRef.current.aimY = ny;
    mobileInputRef.current.isShooting = mag >= AIM_DEADZONE;
  };

  const handleRightUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rightOriginRef.current || rightOriginRef.current.pointerId !== e.pointerId) return;
    rightOriginRef.current = null;
    setRightStick(null);
    mobileInputRef.current.isAiming = false;
    mobileInputRef.current.isShooting = false;
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none touch-none">
      {/* Left Half Touch Zone: Free-floating Movement */}
      <div
        onPointerDown={handleLeftDown}
        onPointerMove={handleLeftMove}
        onPointerUp={handleLeftUp}
        onPointerCancel={handleLeftUp}
        className="pointer-events-auto absolute inset-y-0 left-0 w-1/2 touch-none"
      >
        {!leftStick && (
          <div className="pointer-events-none absolute bottom-16 left-5 sm:bottom-20 sm:left-8 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border border-dashed border-cyan-500/30 bg-zinc-950/25">
            <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400/60">
              WALK
            </span>
          </div>
        )}
      </div>

      {/* Right Half Touch Zone: Free-floating Aim & Shoot */}
      <div
        onPointerDown={handleRightDown}
        onPointerMove={handleRightMove}
        onPointerUp={handleRightUp}
        onPointerCancel={handleRightUp}
        className="pointer-events-auto absolute inset-y-0 right-0 w-1/2 touch-none"
      >
        {!rightStick && (
          <div className="pointer-events-none absolute bottom-16 right-5 sm:bottom-20 sm:right-8 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border border-dashed border-rose-500/30 bg-zinc-950/25">
            <span className="text-[9px] font-mono font-bold tracking-widest text-rose-400/60">
              SHOOT
            </span>
          </div>
        )}
      </div>

      {/* Initial Mobile Controls Instruction Overlay */}
      {showGuide && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            if (onDismissGuide) onDismissGuide();
          }}
          className="pointer-events-auto fixed inset-x-0 top-1/2 -translate-y-1/2 z-30 mx-auto max-w-sm sm:max-w-md px-4"
        >
          <div className="rounded-2xl border border-cyan-500/40 bg-zinc-950/90 p-3.5 sm:p-4 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-md">
            <div className="text-center text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase mb-2.5">
              Touch Controls
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="flex flex-col items-center gap-1 rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-2">
                <Move className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-cyan-300">LEFT SIDE</span>
                <span className="text-[10px] text-zinc-400 leading-tight">Drag to Walk</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-950/30 p-2">
                <Crosshair className="h-4 w-4 text-rose-400" />
                <span className="font-bold text-rose-300">RIGHT SIDE</span>
                <span className="text-[10px] text-zinc-400 leading-tight">Drag to Shoot</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-950/30 p-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-amber-300">DASH</span>
                <span className="text-[10px] text-zinc-400 leading-tight">Tap to Dodge</span>
              </div>
            </div>
            <div className="mt-2.5 text-center text-[10px] font-mono text-zinc-400">
              Tap <span className="text-zinc-200 font-bold">1–5</span> at bottom to switch guns • Touch anywhere to start
            </div>
          </div>
        </div>
      )}

      {/* Active Floating Left Joystick */}
      {leftStick && (
        <div
          className="pointer-events-none fixed flex h-24 w-24 sm:h-28 sm:w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan-500/45 bg-zinc-950/45 backdrop-blur-sm"
          style={{ left: leftStick.originX, top: leftStick.originY }}
        >
          <div className="absolute inset-2.5 sm:inset-3 rounded-full border border-cyan-400/20" />
          <div
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-cyan-300 bg-cyan-500/45 shadow-[0_0_16px_rgba(34,211,238,0.55)]"
            style={{
              transform: `translate(${leftStick.knobX}px, ${leftStick.knobY}px)`,
            }}
          />
        </div>
      )}

      {/* Active Floating Right Joystick */}
      {rightStick && (
        <div
          className="pointer-events-none fixed flex h-24 w-24 sm:h-28 sm:w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-rose-500/45 bg-zinc-950/45 backdrop-blur-sm"
          style={{ left: rightStick.originX, top: rightStick.originY }}
        >
          <div className="absolute inset-2.5 sm:inset-3 rounded-full border border-rose-400/20" />
          <div
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-rose-300 bg-rose-500/45 shadow-[0_0_16px_rgba(244,63,94,0.55)]"
            style={{
              transform: `translate(${rightStick.knobX}px, ${rightStick.knobY}px)`,
            }}
          />
        </div>
      )}

      {/* Right Action Buttons (Dash + Reload) — positioned cleanly above the Shoot zone */}
      <div className="pointer-events-auto fixed bottom-36 right-4 sm:bottom-44 sm:right-6 z-30 flex items-center gap-2.5 touch-none">
        {canReload && (
          <button
            type="button"
            disabled={isReloading}
            onPointerDown={(e) => {
              e.stopPropagation();
              mobileInputRef.current.reloadRequested = true;
            }}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all active:scale-95 ${
              isReloading
                ? "border-amber-500/60 bg-amber-950/60 text-amber-300"
                : "border-zinc-500/60 bg-zinc-900/75 text-zinc-200 active:border-cyan-400"
            }`}
            aria-label="Reload"
          >
            <RotateCw className={`h-4 w-4 sm:h-5 sm:w-5 ${isReloading ? "animate-spin" : ""}`} />
          </button>
        )}

        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            mobileInputRef.current.dashRequested = true;
          }}
          className={`flex h-12 w-12 sm:h-14 sm:w-14 flex-col items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all active:scale-95 ${
            dashReady
              ? "border-amber-400/80 bg-amber-500/25 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
              : "border-zinc-700/70 bg-zinc-900/60 text-zinc-500"
          }`}
          aria-label="Dash"
        >
          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-[8px] font-mono font-bold tracking-wider">DASH</span>
        </button>
      </div>
    </div>
  );
}
