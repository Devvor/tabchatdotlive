import type { Metadata, Viewport } from "next";
import { ClerkProvider, type ClerkProviderProps } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learnor - AI Teachers from Your Links",
  description:
    "Turn any webpage into an AI teacher. Save links and learn through real-time voice conversations.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get Clerk domain from environment variable if using custom domain
  // Note: Clerk automatically prepends "clerk." to custom domains, so we should only provide the base domain
  // e.g., use "tabchat.live" not "clerk.tabchat.live"
  const rawDomain = process.env.NEXT_PUBLIC_CLERK_DOMAIN;
  const clerkDomain = rawDomain?.replace(/^clerk\./, ""); // Remove "clerk." prefix if present
  
  // Build ClerkProvider props - use type assertion to handle conditional domain prop
  // The domain prop is optional and TypeScript may require additional props when it's present,
  // but in practice Clerk handles this correctly at runtime
  const clerkProviderProps = {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    ...(clerkDomain && { domain: clerkDomain }),
  } as ClerkProviderProps;
  
  return (
    <ClerkProvider {...clerkProviderProps}>
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body className="min-h-screen bg-background antialiased">
          <ConvexClientProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-center"
              toastOptions={{
                style: {
                  background: "#18181b",
                  border: "1px solid #27272a",
                  color: "#fafafa",
                },
              }}
            />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

