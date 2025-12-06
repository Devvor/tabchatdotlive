import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Sparkles, 
  Library, 
  LayoutDashboard,
  Search,
  Bell,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-gray-200 bg-white z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight">Learnor</span>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-6">
            <div className="space-y-1">
              <div className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Overview
              </div>
              <NavLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
                Dashboard
              </NavLink>
              <NavLink href="/library" icon={<Library className="w-4 h-4" />}>
                Library
              </NavLink>
            </div>

            <div className="mt-8 space-y-1">
              <div className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Support
              </div>
              <Button variant="ghost" className="w-full justify-start gap-3 h-9 px-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </ScrollArea>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">My Account</p>
                <p className="text-xs text-gray-500 truncate">Pro Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="h-8 w-[1px] bg-gray-200 mx-2" />
            <Button className="bg-black text-white hover:bg-gray-800 h-9 px-4 text-sm font-medium rounded-lg">
              Quick Action
            </Button>
          </div>
        </header>

        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
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
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 h-9 px-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
      asChild
    >
      <Link href={href}>
        {icon}
        {children}
      </Link>
    </Button>
  );
}
