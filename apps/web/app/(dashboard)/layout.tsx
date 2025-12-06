import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

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
          <Image
            src="/tabchat_logo.png"
            alt="TabChat"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-semibold text-lg tracking-tight">TabChat</span>
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
