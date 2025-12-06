import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/library" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Learnor</span>
        </Link>

        {/* Profile at top right */}
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
          }}
        />
      </header>

      <main className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
