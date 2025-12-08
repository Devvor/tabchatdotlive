"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api, Id } from "@tabchatdotlive/convex";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useVapiConversation } from "@/hooks/use-vapi-conversation";
import { VoiceVisualizer } from "@/components/voice-chat/voice-visualizer";
import { ChatMessages } from "@/components/voice-chat/chat-messages";
import { VoiceControls } from "@/components/voice-chat/voice-controls";
import { generateTeacherPrompt, generateFirstMessageHook } from "@/lib/vapi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;

  // Get current user via Convex Auth
  const user = useQuery(api.users.currentUser);

  const [systemPrompt, setSystemPrompt] = useState<string>("");

  // Get conversation from Convex
  const conversation = useQuery(
    api.conversations.getWithMessages,
    conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip"
  );

  // Get topic if conversation has one
  const topic = useQuery(
    api.topics.getWithLink,
    conversation?.topicId ? { topicId: conversation.topicId } : "skip"
  );

  // Get link - either from conversation directly or via topic
  const linkId = conversation?.linkId || topic?.linkId;
  const link = useQuery(
    api.links.getById,
    linkId ? { linkId } : "skip"
  );

  // Mutation to save messages
  const addMessage = useMutation(api.conversations.addMessage);

  // Build system prompt when link content is available
  useEffect(() => {
    if (link?.processedContent) {
      const prompt = generateTeacherPrompt(link.processedContent);
      setSystemPrompt(prompt);
    }
    // No fallback - if no link content, systemPrompt stays empty
  }, [link, conversation]);

  // Handle saving messages to Convex
  const handleMessage = useCallback(
    async (message: { role: "user" | "assistant"; content: string; timestamp: number }) => {
      console.log("Saving message:", message);
      if (conversationId) {
        try {
          await addMessage({
            conversationId: conversationId as Id<"conversations">,
            role: message.role,
            content: message.content,
          });
        } catch (error) {
          console.error("Failed to save message:", error);
        }
      }
    },
    [conversationId, addMessage]
  );

  // Use Vapi conversation hook
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
  } = useVapiConversation({
    systemPrompt,
    firstMessage: link?.title
      ? generateFirstMessageHook(link.title)
      : "Hey! What would you like to learn about today?",
    onMessage: handleMessage,
  });

  const isLoading = conversation === undefined || user === undefined;
  const conversationTitle = conversation?.title || "Conversation";

  // Show not found state
  if (conversation === null && user !== null && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Conversation Not Found</h2>
          <p className="text-gray-500 mb-6">
            This session may have been deleted or you do not have permission to view it.
          </p>
          <Button asChild variant="outline">
            <Link href="/library">Return to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleConnect = async () => {
    if (!systemPrompt) {
      toast.error("No article content available for this conversation.");
      return;
    }
    try {
      await connect();
    } catch (error) {
      toast.error("Failed to connect. Please try again.");
    }
  };

  // Show errors
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>
    );
  }

  // Show error state if conversation exists but no article content is available
  if (conversation && !link?.processedContent && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Article Content Available</h2>
          <p className="text-gray-500 mb-6">
            This conversation doesn't have any article content associated with it. Please start a new conversation with an article from your library.
          </p>
          <Button asChild variant="outline">
            <Link href="/library">Go to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900" asChild>
              <Link href="/library">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">
                {conversationTitle}
              </h1>
              {isConnected && (
                <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                  Connected
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length > 0 ? (
              <div className="max-w-3xl mx-auto">
                <ChatMessages messages={messages} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center px-6 max-w-sm">
                  <div className="mb-8 flex justify-center">
                    <div className="w-32 h-32 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center">
                      <VoiceVisualizer
                        audioLevel={audioLevel}
                        isActive={isConnected}
                        mode={mode}
                      />
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {!isConnected && !isConnecting && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Ready to Learn</h2>
                        <p className="text-sm text-gray-500">Click the microphone to start your voice conversation.</p>
                      </motion.div>
                    )}
                    {isConnecting && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <p className="text-sm font-medium text-gray-500">Connecting...</p>
                      </motion.div>
                    )}
                    {isConnected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <p className="text-sm font-medium text-gray-900 uppercase tracking-wide animate-pulse">
                          {mode === "speaking" ? "AI Speaking..." : "Listening..."}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
            <div className="max-w-3xl mx-auto flex justify-center">
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
      </div>
    </TooltipProvider>
  );
}
