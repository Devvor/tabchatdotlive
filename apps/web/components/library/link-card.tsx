"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@learnor/convex";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  BookOpen, 
  CheckCircle, 
  Circle, 
  MoreVertical,
  ExternalLink,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TLDRDialog } from "./tldr-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LinkCardProps {
  link: any; // Will be properly typed after Convex regenerates types
}

export function LinkCard({ link }: LinkCardProps) {
  const [tldrOpen, setTldrOpen] = useState(false);
  const toggleRead = useMutation(api.links.toggleReadStatus);
  const removeLink = useMutation(api.links.remove);
  
  // Get topic if not provided (fallback for backward compatibility)
  const topic = useQuery(
    api.topics.getByLink,
    link.topic === undefined ? { linkId: link._id } : "skip"
  );
  
  const displayTopic = link.topic || topic;

  const handleToggleRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleRead({ linkId: link._id, isRead: !link.isRead });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this link?")) {
      removeLink({ linkId: link._id });
    }
  };

  const isCompleted = link.status === "completed";
  const isProcessing = link.status === "processing";
  const isFailed = link.status === "failed";

  return (
    <>
      <div className={cn(
        "group relative flex flex-col justify-between p-5 rounded-xl border bg-card transition-all duration-200 hover:shadow-md",
        link.isRead ? "bg-zinc-50/50" : "bg-white border-primary/20 shadow-sm"
      )}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-medium leading-tight line-clamp-2",
                  link.isRead ? "text-muted-foreground" : "text-foreground"
                )}>
                  {link.title}
                </h3>
                {isProcessing && (
                  <Badge variant="secondary" className="h-5 px-1.5 gap-1 text-[10px]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing
                  </Badge>
                )}
                {isFailed && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    Failed
                  </Badge>
                )}
              </div>
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary hover:underline truncate block"
              >
                {new URL(link.url).hostname}
              </a>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleRead}>
                  {link.isRead ? (
                    <>
                      <Circle className="w-4 h-4 mr-2" /> Mark as unread
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" /> Mark as read
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" /> Open original
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRemove} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {displayTopic?.description || link.description || "No description available."}
          </p>
        </div>

        <div className="pt-4 mt-2 flex items-center justify-between border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(link.createdAt, { addSuffix: true })}
          </div>

          <div className="flex items-center gap-2">
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 text-muted-foreground",
                      link.isRead && "text-primary bg-primary/5"
                    )}
                    onClick={handleToggleRead}
                  >
                    {link.isRead ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {link.isRead ? "Mark as unread" : "Mark as read"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 px-3 gap-1.5 font-normal text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTldrOpen(true);
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              TLDR
            </Button>

            <Button 
              size="sm" 
              className="h-8 px-3 gap-1.5 text-xs font-medium"
              disabled={!isCompleted}
              asChild
            >
              <Link href={`/chat/new?linkUrl=${encodeURIComponent(link.url)}`}>
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <TLDRDialog 
        linkId={link._id} 
        title={link.title}
        url={link.url}
        isOpen={tldrOpen} 
        onOpenChange={setTldrOpen} 
      />
    </>
  );
}

