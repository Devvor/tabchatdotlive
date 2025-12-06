"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Loader2, Link as LinkIcon, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useConversation } from "@/hooks/use-conversation";
import { VoiceVisualizer } from "@/components/voice-chat/voice-visualizer";
import { ChatMessages } from "@/components/voice-chat/chat-messages";
import { VoiceControls } from "@/components/voice-chat/voice-controls";
import { scrapeUrl, generateTeacherPrompt } from "@/lib/firecrawl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

export default function NewChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const linkUrl = searchParams.get("linkUrl");

  const [isLoading, setIsLoading] = useState(false);
  const [topicContent, setTopicContent] = useState<{
    markdown: string;
    title?: string;
    summary?: string;
    keyPoints?: string[];
  } | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");

  const handleMessage = useCallback((message: { role: "user" | "assistant"; content: string; timestamp: number }) => {
    console.log("Message:", message);
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

  const loadContent = useCallback(async (url: string) => {
    setIsLoading(true);
    try {
      const result = await scrapeUrl(url);
      if (result.success && result.data) {
        setTopicContent({
          markdown: result.data.markdown,
          title: result.data.extract?.title || result.data.metadata?.title,
          summary: result.data.extract?.summary,
          keyPoints: result.data.extract?.keyPoints,
        });

        const prompt = generateTeacherPrompt(result.data.markdown);
        setSystemPrompt(prompt);
      } else {
        toast.error("Failed to load content");
      }
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load content");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (linkUrl && !topicContent) {
      loadContent(linkUrl);
    }
  }, [linkUrl, topicContent, loadContent]);

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

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-gray-900">
                {topicContent?.title || "New Session"}
              </h1>
              {isConnected && (
                 <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"/>
                   Connected
                 </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm">
             End Session
          </Button>
        </header>

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-4">
                 <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
              </div>
              <p className="text-gray-500 font-medium">Analyzing content...</p>
            </div>
          </div>
        )}

        {/* Topic selection */}
        {!isLoading && !linkUrl && !topicContent && (
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50/50">
            <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-gray-900" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Start Learning
              </h2>
              <p className="text-gray-500 mb-8">
                Choose a source to begin your interactive session.
              </p>
              
              <div className="space-y-4">
                <Button variant="outline" className="w-full h-11 justify-start px-4 bg-white hover:bg-gray-50 text-gray-700 border-gray-200" asChild>
                  <Link href="/library">
                      <BookOpen className="w-4 h-4 mr-3 text-gray-400" />
                      Select from Library
                  </Link>
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400 font-medium">Or paste URL</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                    <Input placeholder="https://..." className="h-11 bg-gray-50 border-gray-200" />
                    <Button className="h-11 px-4 bg-black text-white hover:bg-gray-800" onClick={() => {
                      // In a real app, we'd use state for the input value.
                      // For now, simple prompt as fallback or update this to use state.
                       const url = prompt("Enter URL:");
                       if (url) router.push(`/chat/new?linkUrl=${encodeURIComponent(url)}`);
                    }}>
                        <Zap className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main chat interface */}
        {!isLoading && (topicContent || !linkUrl) && topicContent && (
          <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            {/* Messages area */}
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
                           <h2 className="text-lg font-semibold text-gray-900 mb-1">Ready to start</h2>
                           <p className="text-sm text-gray-500">Click the microphone below to begin talking.</p>
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
              <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
                <VoiceControls
                  isConnected={isConnected}
                  isConnecting={isConnecting}
                  isMuted={isMuted}
                  onConnect={handleConnect}
                  onDisconnect={disconnect}
                  onToggleMute={toggleMute}
                />
                 {topicContent.summary && (
                     <p className="text-xs text-gray-400 max-w-md text-center truncate">
                         Context: {topicContent.summary}
                     </p>
                 )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
