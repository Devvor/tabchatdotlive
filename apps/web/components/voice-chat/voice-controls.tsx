"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Phone, Loader2, X } from "lucide-react";
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
  onClose?: () => void; // Optional close handler for idle state
}

export function VoiceControls({
  isConnected,
  isConnecting,
  isMuted,
  onConnect,
  onDisconnect,
  onToggleMute,
  onClose,
}: VoiceControlsProps) {
  // Show connect button when not connected
  if (!isConnected && !isConnecting) {
    return (
      <div className="flex items-center gap-6">
        {/* Close button (left of mic) */}
        {onClose && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent className="bg-white text-gray-900 border-gray-100 shadow-md">
              Close
            </TooltipContent>
          </Tooltip>
        )}

        {/* Main Connect Button (handled by Visualizer usually, but here as fallback or secondary) */}
        {/* We generally don't show this if Visualizer has the big button, but let's keep it just in case or for consistency */}
         {/* Actually, the page usually hides VoiceControls in idle state. 
             If we want the X button beside the mic, we should probably render VoiceControls in idle state too?
             The page currently says: !isConnected && !isConnecting -> show "Tap to start".
             The Visualizer handles the big Mic button.
             
             Let's leave this part empty/null if we rely on Visualizer for the start button.
             OR, we can move the start button HERE into controls?
             The user likes the big centered Mic button in the visualizer area.
          */}
      </div>
    );
  }

  // Show loading state when connecting
  if (isConnecting) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center"
      >
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
      </motion.div>
    );
  }

  // Show controls when connected
  return (
    <div className="flex items-center gap-6">
      {/* Mute button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
              isMuted
                ? "bg-red-50 text-red-500 border border-red-100"
                : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent className="bg-white text-gray-900 border-gray-100 shadow-md">
          {isMuted ? "Unmute" : "Mute"}
        </TooltipContent>
      </Tooltip>

      {/* End call button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              console.log("End call button clicked");
              onDisconnect();
            }}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200 transition-all duration-200"
          >
            <PhoneOff className="w-7 h-7" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent className="bg-white text-gray-900 border-gray-100 shadow-md">
          End conversation
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
