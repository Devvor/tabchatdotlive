"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Loader2, Zap, Sparkles } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
    onDisconnect: () => {
      toast.info("Session ended", {
        description: "Click the microphone to start a new session",
      });
    },
    onError: (err: Error) => {
      toast.error("Connection error", {
        description: err.message || "Please try again",
      });
    },
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
      <div className="h-[calc(100vh-8rem)] flex flex-col max-w-3xl mx-auto relative">
        {/* Header */}
        <header className="flex-shrink-0 py-4 flex items-center justify-between z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-gray-900 -ml-2 gap-2 pl-2" 
            asChild
          >
            <Link href="/library">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Library</span>
            </Link>
          </Button>
          
          {topicContent && isConnected && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={disconnect}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              End Session
            </Button>
          )}
        </header>

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                 <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                 <Loader2 className="absolute inset-0 w-16 h-16 text-black animate-spin p-4" />
              </div>
              <p className="text-gray-500 font-medium animate-pulse">Reading content...</p>
            </div>
          </div>
        )}

        {/* Topic selection */}
        {!isLoading && !linkUrl && !topicContent && (
          <div className="flex-1 flex items-center justify-center pb-12">
            <div className="max-w-md w-full text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto transform rotate-3">
                  <Sparkles className="w-10 h-10 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  What would you like to learn?
                </h2>
                <p className="text-gray-500">
                  Choose a source to begin your interactive session.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button variant="outline" className="w-full h-12 justify-start px-4 text-base font-medium border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all" asChild>
                  <Link href="/library">
                      <BookOpen className="w-5 h-5 mr-3 text-gray-400" />
                      Select from Library
                  </Link>
                </Button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#F9FAFB] px-3 text-gray-400 font-medium">Or paste URL</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                    <Input placeholder="https://..." className="h-12 bg-white border-gray-200 text-base" />
                    <Button className="h-12 px-5 bg-black text-white hover:bg-gray-800 transition-all shadow-sm" onClick={() => {
                       const url = prompt("Enter URL:");
                       if (url) router.push(`/chat/new?linkUrl=${encodeURIComponent(url)}`);
                    }}>
                        <Zap className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main chat interface */}
        {!isLoading && (topicContent || !linkUrl) && topicContent && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Title Area */}
            <div className="text-center space-y-2 mb-8 flex-shrink-0">
               <h1 className="text-xl font-semibold text-gray-900 max-w-2xl mx-auto leading-tight">
                {topicContent?.title || "New Session"}
              </h1>
               {topicContent.summary && (
                   <p className="text-sm text-gray-500 max-w-lg mx-auto line-clamp-2">
                       {topicContent.summary}
                   </p>
               )}
            </div>

            {/* Active Interaction Area */}
            <div className="flex-1 flex flex-col items-center min-h-0 relative overflow-hidden">
              
              {/* Visualizer Layer */}
              <div className={cn(
                "transition-all duration-500 flex flex-col items-center justify-center w-full",
                messages.length > 0 ? "h-[40%] min-h-[250px]" : "flex-1"
              )}>
                  <div className="relative transform scale-90">
                    <VoiceVisualizer
                      audioLevel={audioLevel}
                      isActive={isConnected}
                      mode={mode}
                      onClick={!isConnected && !isConnecting ? handleConnect : undefined}
                      isLoading={isConnecting}
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {!isConnected && !isConnecting && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mt-6 space-y-2"
                      >
                         <h2 className="text-lg font-semibold text-gray-900">Ready to start</h2>
                         <p className="text-sm text-gray-500">Tap the microphone to begin.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-8 h-20 flex items-center justify-center">
                    {(isConnected || isConnecting) && (
                      <VoiceControls
                        isConnected={isConnected}
                        isConnecting={isConnecting}
                        isMuted={isMuted}
                        onConnect={handleConnect}
                        onDisconnect={disconnect}
                        onToggleMute={toggleMute}
                      />
                    )}
                  </div>
              </div>

              {/* Messages Layer */}
              {messages.length > 0 && (
                 <div className="flex-1 w-full max-w-3xl overflow-hidden flex flex-col bg-white rounded-t-3xl shadow-sm border border-gray-100 mx-4">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversation</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-gray-400 hover:text-gray-900" onClick={() => {
                            // Optional: Clear chat or download
                        }}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Notes
                        </Button>
                    </div>
                    <div className="flex-1 overflow-hidden p-4">
                      <ChatMessages messages={messages} />
                    </div>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
