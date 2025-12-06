"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";

interface VoiceVisualizerProps {
  audioLevel: number;
  isActive: boolean;
  mode: "listening" | "speaking" | "idle";
  onClick?: () => void | Promise<void>;
  isLoading?: boolean;
}

export function VoiceVisualizer({
  audioLevel,
  isActive,
  mode,
  onClick,
  isLoading,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw subtle idle ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      // Draw animated rings based on audio level
      const numRings = 5;
      const baseRadius = 50;
      const maxExpand = 80;
      const normalizedLevel = Math.min(audioLevel * 2.5, 1); // Increased sensitivity

      for (let i = 0; i < numRings; i++) {
        const expandAmount = normalizedLevel * maxExpand * (1 - i * 0.15);
        const radius = baseRadius + expandAmount;
        const alpha = 0.6 - i * 0.1;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          radius - 10,
          centerX,
          centerY,
          radius + 10
        );

        if (mode === "speaking") {
          gradient.addColorStop(0, `rgba(139, 92, 246, ${alpha})`);
          gradient.addColorStop(1, `rgba(99, 102, 241, ${alpha * 0.5})`);
        } else {
          gradient.addColorStop(0, `rgba(34, 197, 94, ${alpha})`);
          gradient.addColorStop(1, `rgba(16, 185, 129, ${alpha * 0.5})`);
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3 - i * 0.4;
        ctx.stroke();
      }

      // Draw center glow
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        baseRadius
      );

      if (mode === "speaking") {
        glowGradient.addColorStop(0, "rgba(139, 92, 246, 0.4)");
        glowGradient.addColorStop(0.5, "rgba(139, 92, 246, 0.1)");
        glowGradient.addColorStop(1, "rgba(139, 92, 246, 0)");
      } else {
        glowGradient.addColorStop(0, "rgba(34, 197, 94, 0.4)");
        glowGradient.addColorStop(0.5, "rgba(34, 197, 94, 0.1)");
        glowGradient.addColorStop(1, "rgba(34, 197, 94, 0)");
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [audioLevel, isActive, mode]);

  return (
    <div className="relative cursor-pointer group" onClick={onClick}>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="w-[300px] h-[300px]"
      />
      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 bg-white/90 px-3 py-1 rounded-full shadow-sm border border-gray-100 backdrop-blur-sm">
                {mode === "speaking" ? "AI Speaking" : "Listening..."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WaveformBars({
  audioLevel,
  isActive,
  barCount = 5,
}: {
  audioLevel: number;
  isActive: boolean;
  barCount?: number;
}) {
  const bars = Array.from({ length: barCount }, (_, i) => {
    const delay = i * 0.1;
    const height = isActive
      ? 10 + audioLevel * 30 * Math.sin((Date.now() / 200 + i) % Math.PI)
      : 10;
    return { delay, height };
  });

  return (
    <div className="flex items-center justify-center gap-1 h-10">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-violet-600 to-indigo-400"
          animate={{
            height: isActive ? `${bar.height}px` : "10px",
          }}
          transition={{
            duration: 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
