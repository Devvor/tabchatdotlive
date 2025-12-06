import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/10 via-background to-background" />
      <div className="relative z-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl shadow-2xl",
              headerTitle: "text-zinc-100",
              headerSubtitle: "text-zinc-400",
              formFieldLabel: "text-zinc-300",
              formFieldInput:
                "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-violet-500",
              footerActionLink: "text-violet-400 hover:text-violet-300",
            },
          }}
        />
      </div>
    </main>
  );
}

