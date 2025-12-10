"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api, Id } from "@tabchatdotlive/convex";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useConversation } from "@/hooks/use-conversation";
import { VoiceVisualizer } from "@/components/voice-chat/voice-visualizer";
import { VoiceControls } from "@/components/voice-chat/voice-controls";
import { LinkCarousel } from "@/components/voice-chat/link-carousel";
import { generateTeacherPrompt, generateFirstMessageHook } from "@/lib/vapi";
// Note: topics table has been removed - all topic data is now embedded in links
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const initialConversationId = params.id as string;

  // === LOCAL STATE FOR IN-PAGE SWIPE (no navigation) ===
  const [currentLinkId, setCurrentLinkId] = useState<Id<"links"> | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string>(initialConversationId);
  const hasInitialized = useRef(false);

  // Convex hooks
  const user = useQuery(api.users.currentUser);
  const conversation = useQuery(
    api.conversations.getWithMessages,
    currentConversationId ? { conversationId: currentConversationId as Id<"conversations"> } : "skip"
  );
  
  // Get linkId directly from conversation (topics table removed)
  const urlLinkId = conversation?.linkId;

  // Get all links for carousel (unread + current)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLinks = useQuery((api.links as any).getByUserWithTopics, user?._id ? { userId: user._id } : "skip");
  
  // Get all active conversations to map links to conversations
  const activeConversations = useQuery(api.conversations.getActiveByUser, user?._id ? { userId: user._id } : "skip");

  const addMessage = useMutation(api.conversations.addMessage);
  const createConversation = useMutation(api.conversations.create);
  const toggleReadStatus = useMutation(api.links.toggleReadStatus);
  const updateConversationStatus = useMutation(api.conversations.updateStatus);

  // Carousel State
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Track if user has ever connected to a call (to know if we should mark as read on close)
  const hasEverConnected = useRef(false);

  // Filter links for carousel - use currentLinkId for filtering (not urlLinkId)
  const activeLinkId = currentLinkId || urlLinkId;
  const carouselLinks = useMemo(() => {
    if (!allLinks) return [];
    // We want unread links OR the current link (even if read)
    const relevant = allLinks.filter((l: any) => !l.isRead || l._id === activeLinkId);
    
    // Keep temporal order (newest first)
    return relevant.map((l: any) => ({
      id: l._id,
      title: l.title,
      ...l
    }));
  }, [allLinks, activeLinkId]);

  // Get the CURRENT link's data (from carousel or direct query)
  // Note: Adjacent links data is already available in carouselLinks from getByUserWithTopics
  const directLinkQuery = useQuery(
    api.links.getById,
    activeLinkId ? { linkId: activeLinkId } : "skip"
  );
  
  // Use carousel data when available, fall back to direct query
  const activeLink = carouselLinks[selectedIndex];
  const link = activeLink?.processedContent ? activeLink : directLinkQuery;

  // Initialize currentLinkId from URL on first load
  useEffect(() => {
    if (!hasInitialized.current && urlLinkId && !currentLinkId) {
      setCurrentLinkId(urlLinkId);
      hasInitialized.current = true;
    }
  }, [urlLinkId, currentLinkId]);

  // Sync selected index when currentLinkId changes
  useEffect(() => {
    if (carouselLinks.length > 0 && activeLinkId) {
      const index = carouselLinks.findIndex((l: any) => l.id === activeLinkId);
      if (index !== -1 && index !== selectedIndex) {
        setSelectedIndex(index);
      }
    }
  }, [carouselLinks.length, activeLinkId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Local state for system prompt
  const [systemPrompt, setSystemPrompt] = useState<string>("");

  // Setup system prompt when link content is available
  useEffect(() => {
    if (link?.processedContent) {
      const prompt = generateTeacherPrompt(link.processedContent);
      setSystemPrompt(prompt);
    }
  }, [link?.processedContent]);

  // Handle message saving - use currentConversationId
  const handleMessage = useCallback(
    async (message: { role: "user" | "assistant"; content: string; timestamp: number }) => {
      if (currentConversationId) {
        try {
          await addMessage({
            conversationId: currentConversationId as Id<"conversations">,
            role: message.role,
            content: message.content,
          });
        } catch (error) {
          console.error("Failed to save message:", error);
        }
      }
    },
    [currentConversationId, addMessage]
  );

  // Initialize conversation
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
    isVapiReady,
  } = useConversation({
    systemPrompt,
    firstMessage: link?.title
      ? generateFirstMessageHook(link.title)
      : "Hey! What would you like to learn about today?",
    onMessage: handleMessage,
  });

  // Handle errors
  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  // Track when user connects to mark completion later
  useEffect(() => {
    if (isConnected) {
      hasEverConnected.current = true;
    }
  }, [isConnected]);

  // Check if we can start a call
  const canStartCall = !!systemPrompt && !!link?.processedContent && isVapiReady;

  const handleConnect = async () => {
    if (!canStartCall) {
      toast.error("Content is still loading. Please wait a moment.");
      return;
    }
    try {
      await connect();
    } catch (error) {
      toast.error("Failed to connect.");
    }
  };

  const handleClose = async () => {
    if (isConnected) {
      disconnect();
    }
    
    // Mark link as read and conversation as completed if user ever connected
    if (hasEverConnected.current && activeLinkId) {
      try {
        await toggleReadStatus({ linkId: activeLinkId, isRead: true });
        if (currentConversationId) {
          await updateConversationStatus({ 
            conversationId: currentConversationId as Id<"conversations">, 
            status: "completed" 
          });
        }
      } catch (err) {
        console.error("Failed to mark as completed:", err);
      }
    }
    
    router.push("/library");
  };

  // === IN-PAGE SWIPE HANDLER (no router.push!) ===
  const handleSwipe = async (index: number) => {
    // Capture previous state before updating
    const previousLinkId = currentLinkId;
    const previousConversationId = currentConversationId;
    const wasConnected = hasEverConnected.current;
    
    setSelectedIndex(index);
    if (isConnected) {
      disconnect();
    }

    const targetLink = carouselLinks[index];
    if (!targetLink || !user) return;

    // Mark previous link as read and conversation as completed if user was connected
    if (wasConnected && previousLinkId) {
      try {
        await toggleReadStatus({ linkId: previousLinkId, isRead: true });
        if (previousConversationId) {
          await updateConversationStatus({ 
            conversationId: previousConversationId as Id<"conversations">, 
            status: "completed" 
          });
        }
      } catch (err) {
        console.error("Failed to mark previous as completed:", err);
      }
    }
    
    // Reset connection tracking for new link
    hasEverConnected.current = false;

    // Update local state immediately (no navigation!)
    setCurrentLinkId(targetLink.id as Id<"links">);
    
    // Clear system prompt so it regenerates for new link
    setSystemPrompt("");

    // Find or create conversation for this link
    const existingConv = activeConversations?.find(
      (c) => c.linkId === targetLink.id
    );

    if (existingConv) {
      // Just update local state - no navigation
      setCurrentConversationId(existingConv._id);
    } else {
      // Create new conversation in background
      try {
        const newConvId = await createConversation({
          userId: user._id as Id<"users">,
          linkId: targetLink.id as Id<"links">,
          title: targetLink.title,
        });
        setCurrentConversationId(newConvId);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        toast.error("Failed to start conversation");
      }
    }
  };

  // === GRANULAR LOADING STATES (don't block entire UI) ===
  const isUserLoading = user === undefined;
  const isCarouselReady = carouselLinks.length > 0;
  const isLinkContentLoading = !link?.processedContent && !!activeLinkId;
  
  // Only show full-page loader if we have no carousel data at all
  const showFullPageLoader = isUserLoading && !isCarouselReady;
  
  // Display logic
  const isCurrentLink = activeLink && activeLink.id === activeLinkId;
  const conversationTitle = activeLink?.title || conversation?.title || "Conversation";
  
  // Get subtitle (source URL or description)
  const getSubtitle = () => {
    if (!activeLink) return null;
    if (activeLink.url) {
      try {
        return new URL(activeLink.url).hostname.replace('www.', '');
      } catch {
        return activeLink.url;
      }
    }
    return activeLink.description || null;
  };
  const subtitle = getSubtitle();

  // Only show full-page loader when absolutely necessary (no carousel data yet)
  if (showFullPageLoader) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // If we have carousel items, use them. If not (and conv failed), show error.
  if (!isCarouselReady && conversation === null && !isUserLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50/50 p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Conversation Not Found</h2>
          <Button asChild variant="outline" className="text-gray-600 hover:text-gray-900">
            <Link href="/library">Return to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Full screen backdrop with blur */}
      <div className="fixed inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 transition-all duration-500">
        
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Back button - positioned above modal */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={handleClose}
          className="relative mb-4 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl border border-gray-200/50 z-30"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        {/* Carousel Container */}
        <div className="w-full h-full flex items-center justify-center">
          <LinkCarousel
            items={carouselLinks}
            selectedIndex={selectedIndex}
            onChange={handleSwipe}
            className="max-w-md w-full"
          >
            {/* Content */}
            <div className="relative z-10 px-8 py-10 flex flex-col min-h-[500px] h-full">
              
              {/* Title and Subtitle */}
              <div className="text-center mb-10 px-4">
                <h1 className="text-xl font-semibold text-gray-900 line-clamp-2 leading-tight tracking-tight mb-2">
                  {conversationTitle}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 font-medium truncate">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Main content area */}
              <div className="flex-1 flex flex-col items-center justify-center -mt-6">
                
                {/* Visualizer */}
                <div className="w-full mb-8">
                  <VoiceVisualizer
                    audioLevel={isCurrentLink ? audioLevel : 0}
                    isActive={isCurrentLink ? isConnected : false}
                    mode={isCurrentLink ? mode : "idle"}
                    onClick={(!isConnected && !isConnecting && canStartCall) ? handleConnect : undefined}
                    isLoading={isConnecting || isLinkContentLoading}
                  />
                </div>

                {/* Status text / Controls */}
                <AnimatePresence mode="wait">
                  {!isConnected && !isConnecting && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center"
                    >
                      <p className="text-sm font-medium text-gray-400">
                        {isLinkContentLoading 
                          ? "Loading content..." 
                          : !canStartCall 
                          ? "Preparing..." 
                          : "Tap to start conversation"}
                      </p>
                    </motion.div>
                  )}
                  
                  {isConnecting && isCurrentLink && (
                    <motion.div
                      key="connecting"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center"
                    >
                      <p className="text-sm font-medium text-orange-500">Connecting...</p>
                    </motion.div>
                  )}
                  
                  {isConnected && isCurrentLink && (
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2"
                    >
                      <VoiceControls
                        isConnected={isConnected}
                        isConnecting={isConnecting}
                        isMuted={isMuted}
                        onConnect={handleConnect}
                        onDisconnect={handleClose}
                        onToggleMute={toggleMute}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </LinkCarousel>
        </div>
      </div>
    </TooltipProvider>
  );
}
