"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Search,
  Plus,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LibraryPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Library</h1>
            <p className="text-muted-foreground">
              Your saved links and learning topics
            </p>
          </div>

          <Button variant="gradient" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Link
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Empty state */}
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <ExternalLink className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-3">
              Your library is empty
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Install our browser extension to save links from any webpage. Once
              saved, we'll process the content so you can learn from it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient">Get Browser Extension</Button>
              <Button variant="outline">Add Link Manually</Button>
            </div>
          </CardContent>
        </Card>

        {/* Link card example (hidden) */}
        <div className="hidden mt-4 space-y-3">
          <LinkCard
            title="Understanding React Server Components"
            url="https://example.com/article"
            status="completed"
            createdAt={new Date()}
          />
        </div>
      </div>
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
      icon: <Clock className="w-3 h-3" />,
      text: "Pending",
      variant: "secondary" as const,
    },
    processing: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      text: "Processing",
      variant: "warning" as const,
    },
    completed: {
      icon: <CheckCircle className="w-3 h-3" />,
      text: "Ready",
      variant: "success" as const,
    },
    failed: {
      icon: <AlertCircle className="w-3 h-3" />,
      text: "Failed",
      variant: "destructive" as const,
    },
  };

  const { icon, text, variant } = statusConfig[status];

  return (
    <Card className="group hover:border-primary/50 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium mb-1 truncate">{title}</h3>
            <p className="text-sm text-muted-foreground truncate mb-2">{url}</p>
            <Badge variant={variant} className="gap-1">
              {icon}
              {text}
            </Badge>
          </div>
          {status === "completed" && (
            <Button
              variant="default"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
              asChild
            >
              <Link href={`/chat/new?linkUrl=${encodeURIComponent(url)}`}>
                <Mic className="w-4 h-4" />
                Learn
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
