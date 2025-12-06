"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@learnor/convex";
import { Id } from "@learnor/convex/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useConversation } from "@/hooks/use-conversation";
import { VoiceVisualizer } from "@/components/voice-chat/voice-visualizer";
import { ChatMessages } from "@/components/voice-chat/chat-messages";
import { VoiceControls } from "@/components/voice-chat/voice-controls";
import { generateTeacherPrompt } from "@/lib/firecrawl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { user } = useUser();

  const [systemPrompt, setSystemPrompt] = useState<string>("");

  const conversation = useQuery(
    api.conversations.getWithMessages,
    conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip"
  );

  const topic = useQuery(
    api.topics.getWithLink,
    conversation?.topicId ? { topicId: conversation.topicId } : "skip"
  );

  const linkId = conversation?.linkId || topic?.linkId;
  const link = useQuery(
    api.links.getById,
    linkId ? { linkId } : "skip"
  );

  useEffect(() => {
    if (link?.processedContent) {
      const prompt = generateTeacherPrompt(link.processedContent);
      setSystemPrompt(prompt);
    } else if (!link && conversation) {
      setSystemPrompt("You are a helpful AI teacher. Help the user learn and understand the topic they're asking about.");
    }
  }, [link, conversation]);

  const handleMessage = useCallback((message: { role: "user" | "assistant"; content: string; timestamp: number }) => {
    console.log("Saving message:", message);
  }, []);

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
    systemPrompt,
    voiceSpeed: 1.3,
    onMessage: handleMessage,
  });

  const isLoading = conversation === undefined || (conversation === null && user !== undefined);
  const conversationTitle = conversation?.title || "Conversation";

  if (conversation === null && user !== undefined && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Conversation Not Found</h2>
          <p className="text-gray-500 mb-6">
            This session may have been deleted or you do not have permission to view it.
          </p>
          <Button asChild variant="outline">
            <Link href="/history">Return to History</Link>
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="h-full flex items-center justify-center">
         <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
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
              <Link href="/history">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">
                {conversationTitle}
              </h1>
              {isConnected && (
                 <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"/>
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
                         <h2 className="text-lg font-semibold text-gray-900 mb-1">Session Paused</h2>
                         <p className="text-sm text-gray-500">Click the microphone to resume.</p>
                </motion.div>
                    )}
                    {isConnected && (
                      <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                      >
                           <p className="text-sm font-medium text-gray-900 uppercase tracking-wide animate-pulse">
                               {mode === 'speaking' ? 'AI Speaking...' : 'Listening...'}
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
