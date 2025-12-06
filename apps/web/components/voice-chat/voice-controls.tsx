"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoiceControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
}

export function VoiceControls({
  isConnected,
  isConnecting,
  isMuted,
  onConnect,
  onDisconnect,
  onToggleMute,
}: VoiceControlsProps) {
  if (!isConnected && !isConnecting) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onConnect}
              size="icon"
              variant="gradient"
              className="w-20 h-20 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50"
            >
              <Mic className="w-8 h-8" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>Start voice conversation</TooltipContent>
      </Tooltip>
    );
  }

  if (isConnecting) {
    return (
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Mute button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onToggleMute}
              size="icon"
              variant={isMuted ? "destructive" : "secondary"}
              className="w-14 h-14 rounded-full"
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
      </Tooltip>

      {/* End call button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onDisconnect}
              size="icon"
              variant="destructive"
              className="w-16 h-16 rounded-full shadow-lg shadow-destructive/30"
            >
              <PhoneOff className="w-7 h-7" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>End conversation</TooltipContent>
      </Tooltip>

      {/* Placeholder for symmetry */}
      <div className="w-14 h-14" />
    </div>
  );
}
