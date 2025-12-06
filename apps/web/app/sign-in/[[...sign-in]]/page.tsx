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

        <SignIn />
      </div>
    </main>
  );
}
