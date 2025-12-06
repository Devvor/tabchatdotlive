"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Mic, Plus, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Ready to learn something new? Start a voice conversation or browse
            your library.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <Link href="/chat/new" className="group">
            <Card className="h-full bg-gradient-to-br from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-all border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                    <Mic className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-1">
                      New Conversation
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Start learning with voice
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/library" className="group">
            <Card className="h-full hover:bg-secondary/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-1">Your Library</h2>
                    <p className="text-sm text-muted-foreground">
                      Browse saved topics
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent activity */}
        <Card className="mb-10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Conversations</CardTitle>
            <Button variant="link" asChild>
              <Link href="/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                No conversations yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Save a link using our browser extension, then start a voice
                conversation to learn about the topic.
              </p>
              <Button variant="gradient" asChild>
                <Link href="/chat/new" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Start Your First Conversation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Browser extension CTA */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  Install the Browser Extension
                </h3>
                <p className="text-sm text-muted-foreground">
                  Save links with one click and turn any webpage into a learning
                  topic.
                </p>
              </div>
              <Button variant="outline" className="whitespace-nowrap">
                Get Extension
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
