"use client";

import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CarouselItem {
  id: string;
  title: string;
  // add other properties as needed for the card preview
}

interface LinkCarouselProps {
  items: CarouselItem[];
  selectedIndex: number;
  onChange: (index: number) => void;
  children: React.ReactNode; // The content of the ACTIVE card
  className?: string;
}

export function LinkCarousel({
  items,
  selectedIndex,
  onChange,
  children,
  className,
}: LinkCarouselProps) {
  const [direction, setDirection] = useState(0);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate rotation based on drag distance for "card feel"
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;
    const { offset, velocity } = info;

    if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      // Swiped right (previous)
      if (selectedIndex > 0) {
        setDirection(-1);
        onChange(selectedIndex - 1);
      }
    } else if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      // Swiped left (next)
      if (selectedIndex < items.length - 1) {
        setDirection(1);
        onChange(selectedIndex + 1);
      }
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      zIndex: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      },
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div 
      className={cn("relative w-full h-full flex flex-col items-center justify-center", className)} 
      ref={containerRef}
    >
      <div className="relative w-full max-w-md h-[600px] flex items-center justify-center perspective-1000">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={selectedIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ x, rotate, opacity }}
            className="absolute w-full h-full bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-blue-900/5 border border-white/50 overflow-hidden ring-1 ring-black/5 cursor-grab active:cursor-grabbing touch-none z-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Background Stack Effect - Next Card Preview */}
        {selectedIndex < items.length - 1 && (
          <div 
            className="absolute top-4 scale-[0.9] translate-y-4 w-full h-full bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/30 z-0 pointer-events-none" 
            style={{ opacity: 0.5 }}
          />
        )}
         {/* Background Stack Effect - Second Next Card Preview */}
         {selectedIndex < items.length - 2 && (
          <div 
            className="absolute top-8 scale-[0.8] translate-y-8 w-full h-full bg-white/20 backdrop-blur-sm rounded-[2rem] border border-white/10 -z-10 pointer-events-none" 
            style={{ opacity: 0.3 }}
          />
        )}
      </div>

      {/* Pagination Dots */}
      <div className="flex gap-2 mt-8 z-20">
        {items.map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300 backdrop-blur-md",
              i === selectedIndex ? "bg-blue-600 w-6" : "bg-gray-300/50 hover:bg-gray-400/50"
            )}
            layout
            initial={false}
            animate={{
              width: i === selectedIndex ? 24 : 8,
              backgroundColor: i === selectedIndex ? "#2563EB" : "rgba(209, 213, 219, 0.5)"
            }}
          />
        ))}
      </div>
    </div>
  );
}

