"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ElevenLabsConversation,
  ConversationMessage,
  ConversationMode,
  ConversationConfig,
} from "@/lib/elevenlabs";

export interface UseConversationOptions {
  agentId?: string;
  systemPrompt?: string;
  onMessage?: (message: ConversationMessage) => void;
}

export interface UseConversationReturn {
  isConnected: boolean;
  isConnecting: boolean;
  mode: ConversationMode;
  isMuted: boolean;
  audioLevel: number;
  messages: ConversationMessage[];
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  clearMessages: () => void;
}

export function useConversation(
  options: UseConversationOptions = {}
): UseConversationReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mode, setMode] = useState<ConversationMode>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const conversationRef = useRef<ElevenLabsConversation | null>(null);

  const connect = useCallback(async () => {
    if (conversationRef.current || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    const config: ConversationConfig = {
      agentId: options.agentId,
      systemPrompt: options.systemPrompt,
      onConnect: () => {
        setIsConnected(true);
        setIsConnecting(false);
        setMode("listening");
      },
      onDisconnect: () => {
        setIsConnected(false);
        setMode("idle");
        conversationRef.current = null;
      },
      onMessage: (message) => {
        setMessages((prev) => [...prev, message]);
        options.onMessage?.(message);
      },
      onError: (err) => {
        setError(err);
        setIsConnecting(false);
      },
      onModeChange: (newMode) => {
        setMode(newMode);
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
    };

    const conversation = new ElevenLabsConversation(config);
    conversationRef.current = conversation;

    try {
      await conversation.connect();
    } catch (err) {
      setIsConnecting(false);
      conversationRef.current = null;
      throw err;
    }
  }, [options.agentId, options.systemPrompt, options.onMessage, isConnecting]);

  const disconnect = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.disconnect();
      conversationRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      conversationRef.current?.setMuted(newMuted);
      return newMuted;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        // Fire and forget - can't await in cleanup
        conversationRef.current.disconnect().catch(console.error);
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    mode,
    isMuted,
    audioLevel,
    messages,
    error,
    connect,
    disconnect,
    toggleMute,
    clearMessages,
  };
}

