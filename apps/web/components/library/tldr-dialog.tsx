"use client";

import { useQuery } from "convex/react";
import { api } from "@learnor/convex";
import { Id } from "@learnor/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, List, Sparkles } from "lucide-react";

interface TLDRDialogProps {
  linkId: Id<"links">;
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TLDRDialog({
  linkId,
  title,
  isOpen,
  onOpenChange,
}: TLDRDialogProps) {
  const topic = useQuery(api.topics.getByLink, isOpen ? { linkId } : "skip");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            TL;DR Summary
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            For: {title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          {topic === undefined ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ) : topic === null ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No summary available for this content yet.</p>
              <p className="text-sm mt-1">Try processing the link again.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
                    <FileText className="w-4 h-4" />
                    Summary
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {topic.summary}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
                    <List className="w-4 h-4" />
                    Key Points
                  </h3>
                  <ul className="space-y-2">
                    {topic.keyPoints.map((point, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2 items-start">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

