"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff } from "lucide-react";
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
  isMuted,
  onDisconnect,
  onToggleMute,
}: VoiceControlsProps) {
  if (!isConnected) {
    return null;
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
              className="w-14 h-14 rounded-full shadow-sm"
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
              className="w-14 h-14 rounded-full shadow-lg shadow-destructive/30"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>End conversation</TooltipContent>
      </Tooltip>
    </div>
  );
}
