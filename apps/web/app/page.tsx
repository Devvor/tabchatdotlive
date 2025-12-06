import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Mic, BookOpen, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-6 py-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Learnor
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button variant="gradient" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-8 gap-2">
              <Zap className="w-3 h-3" />
              Powered by ElevenLabs Conversational AI
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Turn any link into
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
                your AI teacher
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Save articles, docs, or any webpage. Then have a real-time voice
              conversation with an AI that knows the content inside out. Learn
              while you drive, walk, or relax.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" variant="gradient" asChild>
                <Link href="/sign-up" className="gap-2">
                  <Mic className="w-5 h-5" />
                  Start Learning
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="#features" className="gap-2">
                  <BookOpen className="w-5 h-5" />
                  See How It Works
                </Link>
              </Button>
            </div>
          </div>

          {/* Demo visual */}
          <div className="mt-20 max-w-3xl mx-auto">
            <Card className="relative overflow-hidden">
              <div className="absolute -top-px left-20 right-20 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <CardContent className="p-8">
                <div className="flex items-center justify-center py-16">
                  <div className="relative">
                    {/* Animated rings */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <div className="absolute -inset-4 rounded-full border-2 border-primary/30 animate-pulse" />
                    <div className="absolute -inset-8 rounded-full border border-primary/20 animate-pulse" style={{ animationDelay: "0.5s" }} />

                    {/* Center button */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/50 animate-glow">
                      <Mic className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>

                <p className="text-center text-muted-foreground text-sm">
                  "Explain the key concepts from this article..."
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Save Any Link"
              description="Use our browser extension to save articles, documentation, or any webpage you want to learn from."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI Processing"
              description="We extract and understand the content, creating a personalized knowledge base for your AI teacher."
            />
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Voice Chat"
              description="Have natural voice conversations with your AI teacher. Ask questions, get explanations, learn on the go."
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2024 Learnor. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="hover:border-primary/50 transition-colors group">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
