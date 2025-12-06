import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        {/* Navigation */}
        <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-black hover:bg-gray-200">
                <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Link>
            </Button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
            </div>
        </div>

        <SignIn
          appearance={{
            layout: {
                socialButtonsPlacement: "bottom",
                socialButtonsVariant: "blockButton",
            },
            elements: {
              rootBox: "w-full",
              card: "bg-white border border-gray-200 shadow-sm rounded-2xl p-8",
              headerTitle: "text-2xl font-bold text-gray-900 tracking-tight",
              headerSubtitle: "text-gray-500",
              formFieldLabel: "text-gray-700 font-medium",
              formFieldInput:
                "bg-white border-gray-200 text-gray-900 focus:border-black focus:ring-black/5 transition-all rounded-lg h-10",
              footerActionLink: "text-black hover:text-gray-700 underline-offset-4 hover:underline",
              socialButtonsBlockButton: "bg-white border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg h-10 transition-all",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-400",
              formButtonPrimary: "bg-black hover:bg-gray-800 text-white h-10 rounded-lg transition-all",
            },
          }}
        />
      </div>
    </main>
  );
}
