"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useConversation } from "@/hooks/use-conversation";
import { VoiceVisualizer } from "@/components/voice-chat/voice-visualizer";
import { ChatMessages } from "@/components/voice-chat/chat-messages";
import { VoiceControls } from "@/components/voice-chat/voice-controls";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [conversationData, setConversationData] = useState<{
    title: string;
    systemPrompt: string;
  } | null>(null);

  const {
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
  } = useConversation({
    systemPrompt: conversationData?.systemPrompt,
    onMessage: (message) => {
      console.log("Saving message:", message);
    },
  });

  // Load conversation data
  useEffect(() => {
    // TODO: Load from Convex
    setIsLoading(false);
    setConversationData({
      title: "Sample Conversation",
      systemPrompt: "You are a helpful AI teacher.",
    });
  }, [conversationId]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      toast.error("Failed to connect. Please try again.");
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="flex-shrink-0 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-xl">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/history">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">
                {conversationData?.title || "Conversation"}
              </h1>
              {isConnected && (
                <p className="text-xs text-emerald-500">Connected</p>
              )}
            </div>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {messages.length > 0 ? (
            <ChatMessages messages={messages} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <VoiceVisualizer
                    audioLevel={audioLevel}
                    isActive={isConnected}
                    mode={mode}
                  />
                </motion.div>
                {!isConnected && !isConnecting && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">
                      Continue learning
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Tap the microphone to resume your conversation
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 pb-safe">
          <div className="px-6 py-8 flex justify-center">
            <VoiceControls
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMuted={isMuted}
              onConnect={handleConnect}
              onDisconnect={disconnect}
              onToggleMute={toggleMute}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
