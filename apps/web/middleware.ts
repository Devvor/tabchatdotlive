import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/manifest.json",
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow API routes with Authorization header (for extension)
  const authHeader = request.headers.get("authorization");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  
  if (isApiRoute && authHeader && authHeader.startsWith("Bearer ")) {
    // Don't redirect API routes with Authorization header - let the route handle it
    return NextResponse.next();
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
