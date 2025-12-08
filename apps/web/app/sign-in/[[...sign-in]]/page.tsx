"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", { redirectTo: "/library" });
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData, { redirectTo: "/library" });
    } catch (err) {
      setError("Invalid email or password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Image
            src="/tabchat_logo.png"
            alt="TabChat"
            width={64}
            height={64}
            className="rounded-2xl shadow-lg mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-zinc-400 mt-2">Sign in to continue to TabChat</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full h-12 bg-white text-black hover:bg-zinc-100 border-0"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-black px-2 text-zinc-500">or</span>
          </div>
        </div>

        {/* Email/Password Sign In */}
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
          <input name="flow" type="hidden" value="signIn" />
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-white text-black hover:bg-zinc-100"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-zinc-500">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-white hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
