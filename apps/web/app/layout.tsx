import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TabChat - Chat with your tabs",
  description:
    "Turn any webpage into an AI teacher. Save links and learn through real-time voice conversations.",
  manifest: "/manifest.json",
  icons: {
    icon: "/tabchat_logo.png",
    apple: "/tabchat_logo.png",
  },
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
  return (
    <ClerkProvider>
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
