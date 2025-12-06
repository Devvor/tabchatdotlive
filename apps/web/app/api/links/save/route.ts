import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@learnor/convex";
import { verifyToken } from "@/lib/extension-token";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    // Try to get auth from Clerk cookies first (for web app requests)
    let clerkId: string | null = null;
    try {
      const authResult = await auth();
      clerkId = authResult.userId;
    } catch (error) {
      // Auth from cookies failed, try token from extension
    }

    // If no auth from cookies, try extension token
    if (!clerkId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        clerkId = verifyToken(token);
        if (clerkId) {
          console.log("Authenticated via extension token:", clerkId);
        }
      }
    }

    if (!clerkId) {
      // Log for debugging
      const cookieHeader = req.headers.get("cookie");
      const authHeader = req.headers.get("authorization");
      console.error("No Clerk user ID found.");
      console.error("Cookie header present:", !!cookieHeader);
      console.error("Authorization header present:", !!authHeader);
      console.error("Origin:", origin);
      
      return NextResponse.json(
        { 
          error: "Unauthorized - Please sign in to the web app first",
          hint: "Make sure you're logged into the web app and have refreshed your extension token"
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

    console.log("Authenticated user:", clerkId);

    const { url, title, description, favicon } = await req.json();

    if (!url || !title) {
      return NextResponse.json(
        { error: "URL and title are required" },
        { status: 400 }
      );
    }

    // Get or create Convex user
    let convexUser = await convex.query(api.users.getByClerkId, {
      clerkId,
    });

    if (!convexUser) {
      // User doesn't exist in Convex yet - auto-create them
      // This handles the case where webhooks haven't been set up yet
      console.log("User not found in Convex, auto-creating:", clerkId);
      
      const userId = await convex.mutation(api.users.upsertFromClerk, {
        clerkId,
        email: `${clerkId}@placeholder.local`, // Placeholder email - will be updated by webhook later
      });
      
      // Fetch the newly created user
      convexUser = await convex.query(api.users.getByClerkId, {
        clerkId,
      });
      
      if (!convexUser) {
        console.error("Failed to create user in Convex");
        return NextResponse.json(
          { error: "Failed to create user. Please try again." },
          { status: 500 }
        );
      }
      
      console.log("Auto-created user:", convexUser._id);
    }

    // Save link to Convex
    const linkId = await convex.mutation(api.links.create, {
      userId: convexUser._id,
      url,
      title,
      description,
      favicon,
    });

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
