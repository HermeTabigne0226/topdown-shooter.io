"use client";

import React, { useEffect, useRef, useState } from "react";
import { MobileInputState } from "@/types/game";
import { Zap, RotateCw } from "lucide-react";

interface MobileControlsProps {
  mobileInputRef: React.MutableRefObject<MobileInputState>;
  dashReady: boolean;
  canReload: boolean;
  isReloading: boolean;
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
          <div className="pointer-events-none absolute bottom-14 left-6 flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-cyan-500/25 bg-zinc-950/20">
            <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400/50">
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
          <div className="pointer-events-none absolute bottom-14 right-6 flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-rose-500/25 bg-zinc-950/20">
            <span className="text-[9px] font-mono font-bold tracking-widest text-rose-400/50">
              SHOOT
            </span>
          </div>
        )}
      </div>

      {/* Active Floating Left Joystick */}
      {leftStick && (
        <div
          className="pointer-events-none fixed flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan-500/45 bg-zinc-950/45 backdrop-blur-sm"
          style={{ left: leftStick.originX, top: leftStick.originY }}
        >
          <div className="absolute inset-3 rounded-full border border-cyan-400/20" />
          <div
            className="h-12 w-12 rounded-full border-2 border-cyan-300 bg-cyan-500/45 shadow-[0_0_16px_rgba(34,211,238,0.55)]"
            style={{
              transform: `translate(${leftStick.knobX}px, ${leftStick.knobY}px)`,
            }}
          />
        </div>
      )}

      {/* Active Floating Right Joystick */}
      {rightStick && (
        <div
          className="pointer-events-none fixed flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-rose-500/45 bg-zinc-950/45 backdrop-blur-sm"
          style={{ left: rightStick.originX, top: rightStick.originY }}
        >
          <div className="absolute inset-3 rounded-full border border-rose-400/20" />
          <div
            className="h-12 w-12 rounded-full border-2 border-rose-300 bg-rose-500/45 shadow-[0_0_16px_rgba(244,63,94,0.55)]"
            style={{
              transform: `translate(${rightStick.knobX}px, ${rightStick.knobY}px)`,
            }}
          />
        </div>
      )}

      {/* Right Action Buttons (Dash + Reload) */}
      <div className="pointer-events-auto fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-30 flex items-center gap-2.5 touch-none">
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
    </div>
  );
}
