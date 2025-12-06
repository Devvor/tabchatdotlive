import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, Check, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Image
              src="/tabchat_logo.png"
              alt="TabChat"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold text-lg tracking-tight text-black">TabChat</span>
          </div>
          
            <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              Sign In
            </Link>
            <Button className="bg-black text-white hover:bg-gray-800 rounded-lg h-9 px-4" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
        </div>
        </header>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            New: Voice Mode 2.0 is live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
            Turn any webpage into <br/>
            <span className="text-gray-400">your personal tutor.</span>
            </h1>

          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            TabChat reads your open tabs for you. Then, it teaches you through a voice chat.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-black text-white hover:bg-gray-800 h-14 px-8 rounded-xl text-base" asChild>
              <Link href="/sign-up">Start Learning Free</Link>
              </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-base border-gray-200 hover:bg-gray-50" asChild>
              <Link href="#demo">
                <PlayCircle className="w-5 h-5 mr-2" />
                Watch Demo
                </Link>
              </Button>
            </div>
          </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-black mb-4">Everything you need to master any topic</h2>
            <p className="text-gray-500">Simple, powerful tools for active learning.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Instant Capture" 
              desc="Save any URL with one click using our browser extension."
            />
            <FeatureCard
              title="Neural Synthesis" 
              desc="Our AI extracts key concepts and builds a custom lesson plan."
            />
            <FeatureCard
              title="Voice Interface" 
              desc="Ask questions and get answers in real-time, just like a real tutor."
            />
          </div>
          </div>
        </section>

      {/* Social Proof / Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500">
          <p>© 2025 TabChat.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-black">Privacy</Link>
            <Link href="#" className="hover:text-black">Terms</Link>
            <Link href="#" className="hover:text-black">Twitter</Link>
            </div>
          </div>
        </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
      <div className="w-10 h-10 bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
        <Check className="w-5 h-5 text-black" />
      </div>
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
        </div>
  );
}
