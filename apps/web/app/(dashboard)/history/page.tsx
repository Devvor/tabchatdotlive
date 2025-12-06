"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  Clock,
  Play,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Conversation History</h1>
          <p className="text-muted-foreground">
            Review and continue your past learning sessions
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Empty state */}
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-3">
              No conversations yet
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start a voice conversation with your AI teacher to learn about any
              topic. Your conversations will appear here.
            </p>
            <Button variant="gradient" asChild>
              <Link href="/chat/new" className="gap-2">
                <Play className="w-4 h-4" />
                Start Learning
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Conversation list example (hidden) */}
        <div className="hidden space-y-3">
          <ConversationCard
            id="1"
            title="React Server Components"
            lastMessage="That's a great question! Server Components allow you to..."
            date={new Date()}
            messageCount={24}
          />
        </div>
      </div>
    </div>
  );
}

function ConversationCard({
  id,
  title,
  lastMessage,
  date,
  messageCount,
}: {
  id: string;
  title: string;
  lastMessage: string;
  date: Date;
  messageCount: number;
}) {
  return (
    <Card className="group hover:border-primary/50 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{title}</h3>
              <Badge variant="secondary">{messageCount} messages</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-2">
              {lastMessage}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(date)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              asChild
            >
              <Link href={`/chat/${id}`}>Continue</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
