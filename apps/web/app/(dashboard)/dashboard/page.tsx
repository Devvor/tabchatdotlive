"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@learnor/convex";
import Link from "next/link";
import { Search, Plus, Filter, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkCard } from "@/components/library/link-card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Get Convex user
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get links for the user
  const links = useQuery(
    api.links.getByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

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
          (link.description && link.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [links, searchQuery, activeTab]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Library className="w-6 h-6" />
            Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Your collection of saved knowledge sources.
          </p>
        </div>

        <Button className="shadow-sm" asChild>
          <Link href="/chat/new">
            <Plus className="w-4 h-4 mr-2" />
            Add New Link
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 flex-1 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-1 rounded-xl border shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background/50"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="pb-8">
            {links === undefined ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 rounded-xl border bg-card p-4 space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-20 w-full" />
                    <div className="pt-4 flex justify-between">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLinks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLinks.map((link) => (
                  <LinkCard key={link._id} link={link} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Library className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery || activeTab !== "all" 
                    ? "No matches found" 
                    : "Your library is empty"}
                </h2>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  {searchQuery || activeTab !== "all"
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Save articles, docs, or videos to start building your personal knowledge base."}
                </p>
                {!searchQuery && activeTab === "all" && (
                  <Button asChild>
                    <Link href="/chat/new">Add Your First Link</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
