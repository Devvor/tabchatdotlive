"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api, Id } from "@learnor/convex";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Lightbulb, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TLDRDialogProps {
  linkId: Id<"links">;
  title: string;
  url: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TLDRDialog({
  linkId,
  title,
  url,
  isOpen,
  onOpenChange,
}: TLDRDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const topic = useQuery(api.topics.getByLink, isOpen ? { linkId } : "skip");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/links/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });

      if (response.ok) {
        toast.success("Summary generated!");
        // The query will automatically refetch
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to generate summary");
      }
    } catch (error) {
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] sm:max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-2xl border-0 shadow-2xl w-[calc(100vw-2rem)] sm:w-full translate-y-[-45%] sm:translate-y-[-50%] [&>button]:hidden">
        {/* Header with gradient accent */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100/50 relative">
          <div>
            <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 leading-tight line-clamp-2 text-left">
              {title}
            </DialogTitle>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-amber-700/70 hover:text-amber-800 flex items-center gap-1 mt-1.5 group inline-block"
            >
              <span>view article or link</span>
              <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {topic === undefined ? (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
              <div className="space-y-2 pt-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          ) : topic === null ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No summary available yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Click below to generate a summary.</p>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full max-h-[calc(90vh-200px)] sm:max-h-[50vh]">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* The One-Liner */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                  <p className="text-sm sm:text-[15px] text-gray-800 leading-relaxed font-medium">
                    {topic.summary}
                  </p>
                </div>

                {/* Key Takeaways */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Key Takeaways
                  </h3>
                  <div className="space-y-2">
                    {topic.keyPoints.map((point, i) => (
                      <div 
                        key={i} 
                        className="flex gap-3 items-start p-3 rounded-lg bg-white border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700 leading-relaxed flex-1">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        {topic && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
            <Button 
              size="sm" 
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
              onClick={() => onOpenChange(false)}
            >
              Got it, thanks!
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

