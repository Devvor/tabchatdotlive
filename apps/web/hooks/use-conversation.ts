"use client";

import { useVapiConversation, UseVapiConversationOptions, UseVapiConversationReturn } from "./use-vapi-conversation";
import { VapiMode } from "@/lib/vapi";

export interface UseConversationOptions extends UseVapiConversationOptions {}

export interface UseConversationReturn extends Omit<UseVapiConversationReturn, "mode"> {
  mode: VapiMode;
  audioLevel: number;
}

/**
 * Wrapper hook around useVapiConversation that adds audioLevel calculation
 */
export function useConversation(
  options: UseConversationOptions = {}
): UseConversationReturn {
  const {
    isConnected,
    isConnecting,
    mode,
    isMuted,
    messages,
    error,
    audioLevel,
    connect,
    disconnect,
    toggleMute,
    clearMessages,
  } = useVapiConversation(options);

  return {
    isConnected,
    isConnecting,
    mode,
    isMuted,
    messages,
    error,
    audioLevel,
    connect,
    disconnect,
    toggleMute,
    clearMessages,
  };
}

