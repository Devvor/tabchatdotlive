"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@tabchatdotlive/convex";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);

  const handleSignOut = () => {
    void signOut();
  };

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

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 focus:outline-none">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.image || user?.imageUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
