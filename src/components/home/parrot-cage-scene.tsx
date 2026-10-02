"use client";

import { motion, useReducedMotion } from "framer-motion";

type ParrotCageSceneProps = {
  isAnimating: boolean;
};

export function ParrotCageScene({ isAnimating }: ParrotCageSceneProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="relative mx-auto w-full max-w-[360px] rounded-2xl border-4 border-amber-900/50 bg-gradient-to-b from-amber-100 to-amber-200 p-3 shadow-inner"
      data-testid="parrot-cage-scene"
    >
      <div
        className="pointer-events-none absolute inset-2 grid grid-cols-6 gap-3 opacity-25"
        aria-hidden
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-full bg-amber-950/70" />
        ))}
      </div>

      <div className="relative rounded-xl border border-amber-900/20 bg-gradient-to-b from-amber-800/90 to-amber-950 px-3 pt-4 pb-3">
        <div className="mb-3 h-2 rounded-full bg-amber-950/40" aria-hidden />

        <motion.div
          className="relative mx-auto flex w-fit flex-col items-center"
          data-testid="parrot"
          animate={
            isAnimating && !reducedMotion
              ? {
                  y: [0, -10, 0, -6, 0],
                  rotate: [0, -6, 6, -4, 0],
                }
              : { y: 0, rotate: 0 }
          }
          transition={
            isAnimating && !reducedMotion
              ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        >
          <div className="relative">
            <div className="h-8 w-10 rounded-full bg-emerald-500 shadow-sm" />
            <div className="absolute top-2 -right-1 h-5 w-5 rounded-full bg-emerald-600/90" />
            <div className="absolute top-3 -left-2 h-4 w-6 rotate-[-25deg] rounded-full bg-emerald-400" />
            <div className="absolute -top-1 left-2 h-5 w-5 rounded-full bg-emerald-600">
              <div className="absolute top-1.5 left-1 h-1.5 w-1.5 rounded-full bg-zinc-900" />
              <div className="absolute top-2 -right-0.5 h-2 w-3 rounded-sm bg-amber-400" />
            </div>
            <div className="absolute -bottom-1 left-1 h-3 w-8 rounded-b-full bg-emerald-700" />
            <div className="absolute -bottom-3 left-4 flex gap-1">
              <span className="h-3 w-1 rounded-full bg-amber-700" />
              <span className="h-3 w-1 rounded-full bg-amber-700" />
            </div>
          </div>
        </motion.div>

        <div
          className="mt-4 h-3 rounded-md bg-amber-950/50 shadow-inner"
          aria-hidden
        />
      </div>
    </div>
  );
}
