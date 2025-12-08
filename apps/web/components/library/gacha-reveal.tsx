"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@tabchatdotlive/convex";
import { 
  MessageSquare, 
  FileText, 
  ExternalLink, 
  Shuffle, 
  X, 
  Sparkles,
  CheckCircle,
  Circle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TLDRDialog } from "./tldr-dialog";

// Type for topic data
interface Topic {
  _id: string;
  userId: string;
  linkId: string;
  name: string;
  description?: string;
  summary: string;
  keyPoints: string[];
  createdAt: number;
}

// Type for link data
interface LinkWithTopic {
  _id: string;
  userId: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  status: "pending" | "processing" | "completed" | "failed";
  processedContent?: string;
  contentSummary?: string;
  createdAt: number;
  processedAt?: number;
  isRead?: boolean;
  topic?: Topic | null;
}

interface GachaRevealProps {
  isOpen: boolean;
  onClose: () => void;
  unreadLinks: LinkWithTopic[];
  onSelectNew: () => void;
  selectedLink: LinkWithTopic | null;
}

export function GachaReveal({ 
  isOpen, 
  onClose, 
  unreadLinks, 
  onSelectNew,
  selectedLink 
}: GachaRevealProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"spinning" | "revealed">("spinning");
  const [tldrOpen, setTldrOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  
  const toggleRead = useMutation(api.links.toggleReadStatus);
  const createConversation = useMutation(api.conversations.create);

  // Reset phase when opening
  useEffect(() => {
    if (isOpen) {
      setPhase("spinning");
      const timer = setTimeout(() => setPhase("revealed"), 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedLink?._id]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSkip = useCallback(() => {
    if (unreadLinks.length <= 1) return;
    setPhase("spinning");
    setTimeout(() => {
      onSelectNew();
      setTimeout(() => setPhase("revealed"), 1200);
    }, 100);
  }, [unreadLinks.length, onSelectNew]);

  const handleToggleRead = async () => {
    if (!selectedLink) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await toggleRead({ linkId: selectedLink._id as any, isRead: !selectedLink.isRead });
  };

  const handleStartChat = async () => {
    if (!selectedLink) return;
    setIsStartingChat(true);
    try {
      const conversationId = await createConversation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userId: selectedLink.userId as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        linkId: selectedLink._id as any,
        title: selectedLink.title,
      });
      onClose();
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      setIsStartingChat(false);
    }
  };

  if (!isOpen) return null;

  const isCompleted = selectedLink?.status === "completed";
  const displayTopic = selectedLink?.topic;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-[100] bg-black/80 backdrop-blur-md transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Content */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto max-w-lg w-full">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Spinning Phase */}
          {phase === "spinning" && (
            <div className="flex flex-col items-center justify-center animate-pulse">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 animate-spin" 
                  style={{ animationDuration: "0.6s" }} 
                />
                <div className="absolute inset-2 rounded-full bg-black/90 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <p className="mt-6 text-white/60 text-sm font-medium tracking-wide uppercase animate-pulse">
                Finding your next read...
              </p>
            </div>
          )}

          {/* Revealed Phase */}
          {phase === "revealed" && selectedLink && (
            <div className="animate-in zoom-in-95 fade-in duration-500">
              {/* Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-6 pb-8">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5LTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjEgMS43OSA0IDQgNHM0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                  
                  <div 
                    className="animate-in slide-in-from-bottom-4 fade-in duration-500"
                    style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                  >
                    <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-2">
                      Your next adventure
                    </p>
                    <h2 className="text-white text-xl font-bold leading-tight line-clamp-2">
                      {selectedLink.title}
                    </h2>
                    <a 
                      href={selectedLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-white/70 text-sm hover:text-white transition-colors"
                    >
                      {new URL(selectedLink.url).hostname}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <p 
                    className="text-gray-600 text-sm leading-relaxed animate-in slide-in-from-bottom-2 fade-in duration-500"
                    style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
                  >
                    {displayTopic?.description || selectedLink.description || "No description available. Start a chat to explore this content!"}
                  </p>

                  {/* Actions */}
                  <div 
                    className="flex flex-col gap-2 pt-2 animate-in slide-in-from-bottom-2 fade-in duration-500"
                    style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
                  >
                    <div className="flex gap-2">
                      <Button
                        onClick={handleStartChat}
                        disabled={!isCompleted || isStartingChat}
                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-11 rounded-xl font-medium"
                      >
                        {isStartingChat ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageSquare className="w-4 h-4 mr-2" />
                        )}
                        {isStartingChat ? "Starting..." : "Chat with it"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setTldrOpen(true)}
                        className="h-11 px-4 rounded-xl"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        TLDR
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleToggleRead}
                        className="flex-1 h-10 rounded-xl text-sm"
                      >
                        {selectedLink.isRead ? (
                          <>
                            <Circle className="w-4 h-4 mr-2" />
                            Mark unread
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as read
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSkip}
                        disabled={unreadLinks.length <= 1}
                        className="flex-1 h-10 rounded-xl text-sm"
                      >
                        <Shuffle className="w-4 h-4 mr-2" />
                        Skip, next one!
                      </Button>
                    </div>
                  </div>

                  {/* Remaining count */}
                  <p 
                    className="text-center text-xs text-gray-400 pt-2 animate-in fade-in duration-500"
                    style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
                  >
                    {unreadLinks.length} unread {unreadLinks.length === 1 ? "link" : "links"} remaining
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TLDR Dialog */}
      {selectedLink && (
        <TLDRDialog
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          linkId={selectedLink._id as any}
          title={selectedLink.title}
          url={selectedLink.url}
          isOpen={tldrOpen}
          onOpenChange={setTldrOpen}
        />
      )}
    </>
  );
}

