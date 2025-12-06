"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@tabchatdotlive/convex";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  CheckCircle, 
  Circle, 
  MoreVertical,
  ExternalLink,
  Trash2,
  Loader2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TLDRDialog } from "./tldr-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

// Type for link data (matches Convex schema)
interface LinkData {
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

interface LinkCardProps {
  link: LinkData;
}

export function LinkCard({ link }: LinkCardProps) {
  const [tldrOpen, setTldrOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toggleRead = useMutation(api.links.toggleReadStatus);
  const removeLink = useMutation(api.links.remove);
  
  // Get topic if not provided (fallback for backward compatibility)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkIdForQuery = link._id as any; // Convex IDs are strings at runtime
  const topic = useQuery(
    api.topics.getByLink,
    link.topic === undefined ? { linkId: linkIdForQuery } : "skip"
  );
  
  // Merge topic data - use the one from link first, then fallback to queried topic
  const displayTopic: Topic | null | undefined = link.topic ?? (topic as Topic | null | undefined);

  const handleToggleRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toggleRead({ linkId: link._id as any, isRead: !link.isRead });
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await removeLink({ linkId: link._id as any });
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
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
                <DropdownMenuItem onClick={handleRemoveClick} className="text-destructive focus:text-destructive">
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

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TLDRDialog 
        linkId={link._id as any} 
        title={link.title}
        url={link.url}
        isOpen={tldrOpen} 
        onOpenChange={setTldrOpen} 
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{link.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

