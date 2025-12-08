"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

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
  // Show connect button when not connected
  if (!isConnected && !isConnecting) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onConnect}
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>Start conversation</TooltipContent>
      </Tooltip>
    );
  }

  // Show loading state when connecting
  if (isConnecting) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </motion.div>
    );
  }

  // Show controls when connected
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
