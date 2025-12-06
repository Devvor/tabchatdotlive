"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useConversation } from "@/hooks/use-conversation";
import { VoiceVisualizer } from "@/components/voice-chat/voice-visualizer";
import { ChatMessages } from "@/components/voice-chat/chat-messages";
import { VoiceControls } from "@/components/voice-chat/voice-controls";
import { scrapeUrl, generateTeacherPrompt } from "@/lib/firecrawl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    onMessage: (message) => {
      console.log("Message:", message);
    },
  });

  // Load content from URL if provided
  useEffect(() => {
    if (linkUrl && !topicContent) {
      loadContent(linkUrl);
    }
  }, [linkUrl]);

  const loadContent = async (url: string) => {
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

        const prompt = generateTeacherPrompt(result.data.markdown, {
          title: result.data.extract?.title,
          summary: result.data.extract?.summary,
          keyPoints: result.data.extract?.keyPoints,
        });
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
  };

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
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="flex-shrink-0 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-xl">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">
                {topicContent?.title || "New Conversation"}
              </h1>
              {isConnected && (
                <p className="text-xs text-emerald-500">Connected</p>
              )}
            </div>
          </div>
        </header>

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          </div>
        )}

        {/* Topic selection */}
        {!isLoading && !linkUrl && !topicContent && (
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-3">
                  Choose a topic to learn
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select a topic from your library or paste a URL to start
                  learning with your AI teacher.
                </p>
                <div className="space-y-3">
                  <Button variant="gradient" className="w-full" asChild>
                    <Link href="/library">Browse Library</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const url = prompt("Enter a URL to learn from:");
                      if (url) {
                        router.push(
                          `/chat/new?linkUrl=${encodeURIComponent(url)}`
                        );
                      }
                    }}
                  >
                    Paste URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main chat interface */}
        {!isLoading && (topicContent || !linkUrl) && topicContent && (
          <>
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
                    <AnimatePresence mode="wait">
                      {!isConnected && !isConnecting && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-6"
                        >
                          <h2 className="text-lg font-semibold mb-2">
                            Ready to learn
                          </h2>
                          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Tap the microphone to start a voice conversation
                            with your AI teacher
                          </p>
                        </motion.div>
                      )}
                      {isConnected && mode === "listening" && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 text-sm text-emerald-500"
                        >
                          Listening... speak your question
                        </motion.p>
                      )}
                      {isConnected && mode === "speaking" && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 text-sm text-primary"
                        >
                          AI is speaking...
                        </motion.p>
                      )}
                    </AnimatePresence>
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

              {/* Topic info bar */}
              {topicContent.summary && (
                <div className="px-4 pb-4">
                  <Card className="max-w-2xl mx-auto bg-secondary/50">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {topicContent.summary}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
