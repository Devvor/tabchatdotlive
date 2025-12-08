"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { VapiMessage } from "@/lib/vapi";

interface ChatMessagesProps {
  messages: VapiMessage[];
  isCompact?: boolean;
}

export function ChatMessages({ messages, isCompact = false }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <ScrollArea className={cn("px-4", isCompact ? "max-h-40" : "flex-1")}>
      <div ref={scrollRef}>
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={`${message.timestamp}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex gap-3 mb-4",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <Avatar
                className={cn(
                  "w-8 h-8",
                  message.role === "user"
                    ? "bg-primary"
                    : "bg-gradient-to-br from-primary to-accent"
                )}
              >
                <AvatarFallback
                  className={cn(
                    message.role === "user"
                      ? "bg-primary"
                      : "bg-gradient-to-br from-primary to-accent"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn("flex-1", message.role === "user" && "text-right")}
              >
                <p
                  className={cn(
                    "inline-block px-4 py-2 rounded-2xl text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}
                >
                  {message.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
