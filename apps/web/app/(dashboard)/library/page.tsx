"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@tabchatdotlive/convex";
import Link from "next/link";
import { Search, Library as LibraryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkCard } from "@/components/library/link-card";
import { ActivityCalendar } from "@/components/library/activity-calendar";

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
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isEnsuringUser, setIsEnsuringUser] = useState(false);

  // Get Convex user
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Ensure user exists in Convex when they're logged in
  useEffect(() => {
    if (user?.id && convexUser === null && !isEnsuringUser) {
      setIsEnsuringUser(true);
      fetch("/api/users/ensure", {
        method: "POST",
      })
        .then((res) => {
          if (!res.ok) {
            console.error("Failed to ensure user exists");
          }
        })
        .catch((error) => {
          console.error("Error ensuring user:", error);
        })
        .finally(() => {
          setIsEnsuringUser(false);
        });
    }
  }, [user?.id, convexUser, isEnsuringUser]);

  // Get links for the user with topics
  // Using type assertion since Convex types may need regeneration with `npx convex dev`
  const links = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.links as any).getByUserWithTopics,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  ) as LinkWithTopic[] | undefined;

  // Filter links
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
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          (link.topic?.description && link.topic.description.toLowerCase().includes(query)) ||
          (link.description && link.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [links, searchQuery, activeTab]);

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
      </div>

      {/* Activity Calendar */}
      {convexUser?._id && (
        <ActivityCalendar userId={convexUser._id} />
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
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

      {/* Links list */}
      {links !== undefined && filteredLinks.length > 0 && (
        <div className="space-y-4">
          {filteredLinks.map((link) => (
            <LinkCard key={link._id} link={link} />
          ))}
        </div>
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
    </div>
  );
}
