"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import {
  VapiConversation,
  VapiMessage,
  VapiMode,
  VapiConfig,
} from "@/lib/vapi";

export interface UseVapiConversationOptions {
  assistantId?: string;
  systemPrompt?: string;
  firstMessage?: string;
  onMessage?: (message: VapiMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface UseVapiConversationReturn {
  isConnected: boolean;
  isConnecting: boolean;
  mode: VapiMode;
  isMuted: boolean;
  messages: VapiMessage[];
  error: Error | null;
  audioLevel: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  clearMessages: () => void;
  isVapiReady: boolean; // New: indicates if VAPI SDK is pre-initialized
}

// Module-level singleton for pre-initialized Vapi SDK
let preInitializedVapi: Vapi | null = null;

export function useVapiConversation(
  options: UseVapiConversationOptions = {}
): UseVapiConversationReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mode, setMode] = useState<VapiMode>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVapiReady, setIsVapiReady] = useState(!!preInitializedVapi);

  const conversationRef = useRef<VapiConversation | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const vapiInstanceRef = useRef<Vapi | null>(preInitializedVapi);

  // Pre-initialize VAPI SDK on mount for faster connections
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (publicKey && !vapiInstanceRef.current) {
      console.log("[VAPI] Pre-initializing SDK...");
      vapiInstanceRef.current = new Vapi(publicKey);
      preInitializedVapi = vapiInstanceRef.current;
      setIsVapiReady(true);
      console.log("[VAPI] SDK pre-initialized and ready");
    } else if (vapiInstanceRef.current) {
      setIsVapiReady(true);
    }
  }, []);

  const connect = useCallback(async () => {
    if (conversationRef.current || isConnecting) return;

    setIsConnecting(true);
    setError(null);
    processedMessagesRef.current.clear();

    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      const err = new Error("VAPI public key not configured");
      setError(err);
      setIsConnecting(false);
      throw err;
    }

    // Ensure Vapi instance is ready (should already be pre-initialized)
    if (!vapiInstanceRef.current) {
      console.log("[VAPI] Creating instance on-demand (was not pre-initialized)");
      vapiInstanceRef.current = new Vapi(publicKey);
      preInitializedVapi = vapiInstanceRef.current;
    }

    // When systemPrompt is provided, use an inline/transient assistant so the content
    // is actually passed to the model. assistantId overrides don't support model.messages.
    const useInlineAssistant = !!options.systemPrompt;
    
    const config: VapiConfig = {
      publicKey,
      vapiInstance: vapiInstanceRef.current, // Use pre-initialized instance
      // Only use assistantId if we're NOT using inline assistant with content
      assistantId: useInlineAssistant ? undefined : (options.assistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID),
      assistantOverrides: options.systemPrompt
        ? {
            transcriber: {
              provider: "deepgram",
              model: "nova-3",
              language: "en",
            },
            model: {
              provider: "google",
              model: "gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: options.systemPrompt,
                },
              ],
            },
            voice: {
              provider: "11labs",
              voiceId: "ErXwobaYiN019PkySvjV",
            },
            firstMessage: options.firstMessage,
          }
        : undefined,
      onConnect: () => {
        setIsConnected(true);
        setIsConnecting(false);
        setMode("listening");
        options.onConnect?.();
      },
      onDisconnect: () => {
        console.log("onDisconnect callback fired");
        setIsConnected(false);
        setIsConnecting(false);
        setMode("idle");
        setAudioLevel(0);
        // Note: conversationRef is cleared in the disconnect() function
        options.onDisconnect?.();
      },
      onMessage: (message) => {
        // Deduplicate messages using content + timestamp hash
        const messageKey = `${message.role}-${message.content}-${Math.floor(message.timestamp / 1000)}`;
        if (!processedMessagesRef.current.has(messageKey)) {
          processedMessagesRef.current.add(messageKey);
          setMessages((prev) => [...prev, message]);
          options.onMessage?.(message);
        }
      },
      onError: (err) => {
        setError(err);
        setIsConnecting(false);
        options.onError?.(err);
      },
      onModeChange: (newMode) => {
        setMode(newMode);
      },
      onVolumeLevel: (level) => {
        setAudioLevel(level);
      },
    };

    const conversation = new VapiConversation(config);
    conversationRef.current = conversation;

    try {
      await conversation.connect();
    } catch (err) {
      setIsConnecting(false);
      conversationRef.current = null;
      throw err;
    }
  }, [
    options.assistantId,
    options.systemPrompt,
    options.firstMessage,
    options.onMessage,
    options.onConnect,
    options.onDisconnect,
    options.onError,
    isConnecting,
  ]);

  const disconnect = useCallback(async () => {
    console.log("useVapiConversation.disconnect() called, ref exists:", !!conversationRef.current);
    if (conversationRef.current) {
      const ref = conversationRef.current;
      // Clear ref first to prevent double-disconnect
      conversationRef.current = null;
      await ref.disconnect();
      console.log("useVapiConversation.disconnect() completed");
    } else {
      console.log("useVapiConversation.disconnect() - no conversation ref");
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
    processedMessagesRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.disconnect().catch(console.error);
      }
    };
  }, []);

  // Derive audio level from mode if not available from volume-level event
  const derivedAudioLevel = audioLevel > 0 
    ? audioLevel 
    : mode === "speaking" 
    ? 0.7 
    : mode === "listening" 
    ? 0.3 
    : 0;

  return {
    isConnected,
    isConnecting,
    mode,
    isMuted,
    messages,
    error,
    audioLevel: derivedAudioLevel,
    connect,
    disconnect,
    toggleMute,
    clearMessages,
    isVapiReady,
  };
}

