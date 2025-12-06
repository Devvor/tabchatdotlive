"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@learnor/convex";
import Link from "next/link";
import {
  Search,
  Plus,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  ArrowRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter links by search query
  const filteredLinks = useMemo(() => {
    if (!links) return [];
    if (!searchQuery.trim()) return links;
    
    const query = searchQuery.toLowerCase();
    return links.filter(
      (link) =>
        link.title.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query) ||
        link.description?.toLowerCase().includes(query)
    );
  }, [links, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Library</h1>
          <p className="text-gray-500 mt-1">
            Manage your learning sources and content.
            </p>
          </div>

        <Button className="bg-black text-white hover:bg-gray-800 shadow-sm" asChild>
           <Link href="/chat/new">
             <Plus className="w-4 h-4 mr-2" />
             Add New Link
           </Link>
          </Button>
        </div>

      {/* Controls */}
      <div className="flex gap-4 items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-none shadow-none focus-visible:ring-0 bg-transparent h-10"
          />
        </div>
        <div className="h-6 w-[1px] bg-gray-200" />
        <Button variant="ghost" size="sm" className="text-gray-500 gap-2 mr-1">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Loading state */}
      {links === undefined && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {/* Links list */}
      {links !== undefined && filteredLinks.length > 0 && (
        <div className="grid gap-4">
          {filteredLinks.map((link) => (
            <LinkCard
              key={link._id}
              title={link.title}
              url={link.url}
              status={link.status}
              createdAt={new Date(link.createdAt)}
            />
          ))}
        </div>
      )}

        {/* Empty state */}
      {links !== undefined && filteredLinks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
           <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
             <Database className="w-8 h-8 text-gray-400" />
            </div>
           <h2 className="text-lg font-semibold text-gray-900 mb-2">
             {searchQuery ? "No matches found" : "Your library is empty"}
            </h2>
           <p className="text-gray-500 mb-6 max-w-md mx-auto">
             {searchQuery
               ? "Try adjusting your search terms"
               : "Save articles, docs, or videos to start building your knowledge base."}
           </p>
           {!searchQuery && (
             <Button variant="outline" asChild>
               <Link href="/chat/new">Add First Link</Link>
             </Button>
           )}
        </div>
      )}
    </div>
  );
}

function LinkCard({
  title,
  url,
  status,
  createdAt,
}: {
  title: string;
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
}) {
  const statusConfig = {
    pending: {
      icon: <Clock className="w-3.5 h-3.5" />,
      text: "Queued",
      className: "bg-yellow-50 text-yellow-700 border-yellow-100"
    },
    processing: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      text: "Analyzing",
      className: "bg-blue-50 text-blue-700 border-blue-100"
    },
    completed: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      text: "Ready",
      className: "bg-green-50 text-green-700 border-green-100"
    },
    failed: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      text: "Failed",
      className: "bg-red-50 text-red-700 border-red-100"
    },
  };

  const config = statusConfig[status];

  return (
    <div className="group bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-0.5">
             <h3 className="font-medium text-gray-900 truncate">{title}</h3>
             <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${config.className}`}>
                {config.icon}
                {config.text}
             </div>
          </div>
          <p className="text-sm text-gray-400 truncate font-mono">{url}</p>
        </div>
          </div>
        
          {status === "completed" && (
        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-gray-900" asChild>
              <Link href={`/chat/new?linkUrl=${encodeURIComponent(url)}`}>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          )}
        </div>
  );
}
