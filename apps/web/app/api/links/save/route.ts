import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@tabchatdotlive/convex";

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  try {
    // Check for Authorization header first (for extension requests)
    const authHeader = req.headers.get("authorization");
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("Using token from Authorization header");
    } else {
      // Fall back to cookie-based auth (for web app requests)
      const { getToken, userId } = await auth();
      if (userId) {
        token = await getToken({ template: "convex" });
        console.log("Using token from Clerk session");
      }
    }

    if (!token) {
      console.error("No auth token found");
      
      return NextResponse.json(
        { 
          error: "Unauthorized - Please sign in to the web app first",
          hint: "Make sure you're logged into the web app"
        },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Create a ConvexHttpClient instance with the token
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);

    // Get current user using the authenticated client
    let convexUser;
    try {
      convexUser = await convex.query(api.users.currentUser, {});
    } catch (error: unknown) {
      // Check if this is an authentication error (expired/invalid token)
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("Unauthenticated") || errorMessage.includes("Could not verify")) {
        console.error("Token verification failed:", errorMessage);
        return NextResponse.json(
          { 
            error: "Token expired or invalid. Please sign in again.",
            code: "TOKEN_EXPIRED",
            hint: "Your session has expired. Please sign in to the web app again."
          },
          { 
            status: 401,
            headers: {
              "Access-Control-Allow-Origin": origin || "*",
              "Access-Control-Allow-Credentials": "true",
            },
          }
        );
      }
      throw error; // Re-throw other errors
    }

    if (!convexUser) {
      console.error("User not found in Convex");
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { 
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    console.log("Authenticated user:", convexUser._id);

    const { url, title, description, favicon } = await req.json();

    if (!url || !title) {
      return NextResponse.json(
        { error: "URL and title are required" },
        { 
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Create link and schedule scraping via Convex action
    // This handles deduplication, creates the link, and schedules background processing
    const linkId = await convex.mutation(api.links.createAndScrape, {
      userId: convexUser._id,
      url,
      title,
      description,
      favicon,
    });

    console.log("Link created and scraping scheduled:", linkId);

    return NextResponse.json(
      {
        success: true,
        linkId,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("Save link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
}
