import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, Library, History, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Learnor
              </span>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </header>

        {/* Desktop sidebar */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-1 bg-card border-r border-border">
            {/* Logo */}
            <div className="flex items-center gap-2 px-6 py-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Learnor
              </span>
            </div>

            <Separator />

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              <NavLink href="/dashboard" icon={<MessageSquare className="w-5 h-5" />}>
                Dashboard
              </NavLink>
              <NavLink href="/library" icon={<Library className="w-5 h-5" />}>
                Library
              </NavLink>
              <NavLink href="/history" icon={<History className="w-5 h-5" />}>
                History
              </NavLink>
            </nav>

            {/* User section */}
            <div className="px-4 py-4 border-t border-border">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/50">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9",
                    },
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">My Account</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
          <div className="flex items-center justify-around py-2">
            <MobileNavLink href="/dashboard" icon={<MessageSquare className="w-5 h-5" />}>
              Chat
            </MobileNavLink>
            <MobileNavLink href="/library" icon={<Library className="w-5 h-5" />}>
              Library
            </MobileNavLink>
            <MobileNavLink href="/history" icon={<History className="w-5 h-5" />}>
              History
            </MobileNavLink>
          </div>
        </nav>

        {/* Main content */}
        <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href={href}>
            <span className="text-muted-foreground group-hover:text-primary transition-colors">
              {icon}
            </span>
            {children}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{children}</TooltipContent>
    </Tooltip>
  );
}

function MobileNavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
    >
      {icon}
      <span className="text-xs">{children}</span>
    </Link>
  );
}
