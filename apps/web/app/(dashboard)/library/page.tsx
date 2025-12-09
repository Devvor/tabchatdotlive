"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@tabchatdotlive/convex";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { Search, Library as LibraryIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LinkCard } from "@/components/library/link-card";
import { ActivityCalendar } from "@/components/library/activity-calendar";
import { GachaReveal } from "@/components/library/gacha-reveal";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

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

// Type for link data with topic (matches getByUserWithTopics return)
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

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [activeTab, setActiveTab] = useState("all");
  const [gachaOpen, setGachaOpen] = useState(false);
  const [selectedGachaLink, setSelectedGachaLink] = useState<LinkWithTopic | null>(null);

  // Get current user via Convex Auth
  const user = useQuery(api.users.currentUser);

  // Get links for the user with topics
  const links = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.links as any).getByUserWithTopics,
    user?._id ? { userId: user._id } : "skip"
  ) as LinkWithTopic[] | undefined;

  // Calculate unread links
  const unreadLinks = useMemo(() => {
    if (!links) return [];
    return links.filter((link) => !link.isRead);
  }, [links]);

  // Calculate unread count
  const unreadCount = unreadLinks.length;

  // Pick a random unread link
  const pickRandomUnread = useCallback(() => {
    if (unreadLinks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * unreadLinks.length);
    setSelectedGachaLink(unreadLinks[randomIndex]);
  }, [unreadLinks]);

  // Open gacha reveal
  const handleSurpriseMe = useCallback(() => {
    pickRandomUnread();
    setGachaOpen(true);
  }, [pickRandomUnread]);

  // Filter links (uses debounced search query for performance)
  const filteredLinks = useMemo(() => {
    if (!links) return [];
    
    let filtered = links;

    // Filter by tab
    if (activeTab === "unread") {
      filtered = filtered.filter((link) => !link.isRead);
    } else if (activeTab === "read") {
      filtered = filtered.filter((link) => link.isRead);
    }

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          (link.topic?.description && link.topic.description.toLowerCase().includes(query)) ||
          (link.description && link.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [links, debouncedSearchQuery, activeTab]);

  // Virtualization for the links list
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredLinks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of each LinkCard (including gap)
    overscan: 5, // Render 5 extra items above/below viewport
    measureElement: (element) => element.getBoundingClientRect().height, // Dynamically measure actual height
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <LibraryIcon className="w-6 h-6" />
            Library
          </h1>
          <p className="text-gray-500 mt-1">
            Your collection of endless tabs you said you were gonna read but you didn't.
          </p>
        </div>
        <Button
          onClick={handleSurpriseMe}
          disabled={unreadCount === 0}
          className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Surprise Me
        </Button>
      </div>

      {/* Activity Calendar */}
      <ActivityCalendar links={links} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              Unread
              {unreadCount > 0 && (
                <span className="h-5 min-w-5 px-1.5 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-semibold rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Loading state */}
      {links === undefined && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl border bg-white p-4 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="pt-4 flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Links list - virtualized for performance with large lists */}
      {links !== undefined && filteredLinks.length > 0 && (
        <TooltipProvider>
          <div
            ref={parentRef}
            className="h-[calc(100vh-400px)] min-h-[400px] overflow-auto"
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const link = filteredLinks[virtualItem.index];
                return (
                  <div
                    key={link._id}
                    ref={virtualizer.measureElement}
                    data-index={virtualItem.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="pb-4"
                  >
                    <LinkCard link={link} />
                  </div>
                );
              })}
            </div>
          </div>
        </TooltipProvider>
      )}

      {/* Empty state */}
      {links !== undefined && filteredLinks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <LibraryIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || activeTab !== "all" 
              ? "No matches found" 
              : "Your library is empty"}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery || activeTab !== "all"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Save articles, docs, or videos to start building your personal knowledge base."}
          </p>
          {!searchQuery && activeTab === "all" && (
            <Button variant="outline" asChild>
              <Link href="/chat/new">Add Your First Link</Link>
            </Button>
          )}
        </div>
      )}

      {/* Gacha Reveal */}
      <GachaReveal
        isOpen={gachaOpen}
        onClose={() => setGachaOpen(false)}
        unreadLinks={unreadLinks}
        onSelectNew={pickRandomUnread}
        selectedLink={selectedGachaLink}
      />
    </div>
  );
}
