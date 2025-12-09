import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black px-4">
      <div className="flex flex-col items-center mb-8">
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
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-zinc-900 border border-zinc-800 shadow-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton: "bg-white text-black hover:bg-zinc-100 border-0",
            socialButtonsBlockButtonText: "font-medium",
            dividerLine: "bg-zinc-800",
            dividerText: "text-zinc-500",
            formFieldLabel: "text-zinc-300",
            formFieldInput: "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500",
            formButtonPrimary: "bg-white text-black hover:bg-zinc-100",
            footerActionLink: "text-white hover:text-zinc-300",
            identityPreviewText: "text-white",
            identityPreviewEditButton: "text-zinc-400 hover:text-white",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/library"
      />
    </div>
  );
}
