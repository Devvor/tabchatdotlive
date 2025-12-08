import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/extension/token", // Allow extension token endpoint
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Allow API routes with Authorization header (for extension)
  const authHeader = request.headers.get("authorization");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  
  if (isApiRoute && authHeader && authHeader.startsWith("Bearer ")) {
    // Don't redirect API routes with Authorization header - let the route handle it
    return;
  }
  
  // Redirect unauthenticated users away from protected routes
  if (!isPublicRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }

  // Redirect authenticated users away from auth pages
  if (
    (request.nextUrl.pathname.startsWith("/sign-in") ||
      request.nextUrl.pathname.startsWith("/sign-up")) &&
    (await convexAuth.isAuthenticated())
  ) {
    return nextjsMiddlewareRedirect(request, "/library");
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
