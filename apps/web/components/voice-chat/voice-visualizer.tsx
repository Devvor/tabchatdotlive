"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";

interface VoiceVisualizerProps {
  audioLevel: number;
  isActive: boolean;
  mode: "listening" | "speaking" | "idle";
  onClick?: () => void | Promise<void>;
  isLoading?: boolean;
}

// Track if we've already requested mic permission
let micPermissionRequested = false;

export function VoiceVisualizer({
  audioLevel,
  isActive,
  mode,
  onClick,
  isLoading,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const currentLevelRef = useRef<number>(0);

  // Pre-warm microphone permission on hover to reduce latency when clicking
  const handleHoverStart = useCallback(() => {
    if (micPermissionRequested || isActive || isLoading) return;
    
    // Request microphone permission in the background
    // This will either prompt the user (if not yet granted) or use cached permission
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Immediately stop the stream - we just wanted to trigger the permission
        stream.getTracks().forEach(track => track.stop());
        micPermissionRequested = true;
        console.log("[MIC] Permission pre-warmed on hover");
      })
      .catch((err) => {
        // User denied or error - that's fine, we'll handle it on actual click
        console.log("[MIC] Pre-warm failed (will retry on click):", err.name);
      });
  }, [isActive, isLoading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use high DPI canvas for sharpness
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      // Clear with transparent background
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate current level
      currentLevelRef.current += (audioLevel - currentLevelRef.current) * 0.1;

      if (!isActive) {
        // Draw subtle idle line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = "rgba(100, 116, 139, 0.2)"; // Light slate color
        ctx.lineWidth = 2;
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Increment time for animation
      timeRef.current += 0.08;

      // Use interpolated level for smoothness
      const normalizedLevel = Math.min(Math.max(currentLevelRef.current * 1.5, 0.1), 1);
      const baseAmplitude = 20 + normalizedLevel * 50;

      // Define wave configurations with warm orange-red gradients
      const waves = [
        { amplitude: baseAmplitude * 1.0, frequency: 0.008, speed: 0.8, alpha: 0.85, color: "234, 88, 12" },   // Orange-600
        { amplitude: baseAmplitude * 0.8, frequency: 0.012, speed: 1.0, alpha: 0.6, color: "249, 115, 22" },   // Orange-500
        { amplitude: baseAmplitude * 0.6, frequency: 0.015, speed: 1.2, alpha: 0.4, color: "239, 68, 68" },    // Red-500
        { amplitude: baseAmplitude * 0.4, frequency: 0.02, speed: 1.5, alpha: 0.25, color: "251, 146, 60" },   // Orange-400
      ];

      // Draw each wave
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let x = 0; x <= width; x++) {
          const phase = timeRef.current * wave.speed;
          const y = centerY + 
            Math.sin(x * wave.frequency + phase) * wave.amplitude * Math.sin(timeRef.current * 0.1 + x * 0.001);

          ctx.lineTo(x, y);
        }

        const gradient = ctx.createLinearGradient(0, centerY - wave.amplitude, 0, centerY + wave.amplitude);
        gradient.addColorStop(0, `rgba(${wave.color}, 0)`);
        gradient.addColorStop(0.5, `rgba(${wave.color}, ${wave.alpha})`);
        gradient.addColorStop(1, `rgba(${wave.color}, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel, isActive, mode]);

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Wave visualization area */}
      <div className="w-full h-40 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%" }}
          className="w-full h-full"
        />
      </div>

      {/* Mic button */}
      <AnimatePresence mode="wait">
        {!isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            <button
              onClick={onClick}
              onMouseEnter={handleHoverStart}
              onTouchStart={handleHoverStart}
              disabled={isLoading && !onClick}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white flex items-center justify-center shadow-xl shadow-orange-200/50 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 hover:scale-105 hover:shadow-orange-300/60 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
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
    const height = isActive
      ? 10 + audioLevel * 30 * Math.sin((Date.now() / 200 + i) % Math.PI)
      : 10;
    return { height };
  });

  return (
    <div className="flex items-center justify-center gap-1 h-10">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-red-500 via-orange-500 to-orange-400"
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
