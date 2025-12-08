import { NextRequest, NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@tabchatdotlive/convex";
import { fetchQuery } from "convex/nextjs";

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
    // Get auth token from Convex Auth
    const token = await convexAuthNextjsToken();

    if (!token) {
      console.error("No Convex Auth token found");
      
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

    // Get current user using the token
    const convexUser = await fetchQuery(
      api.users.currentUser,
      {},
      { token }
    );

    if (!convexUser) {
      console.error("User not found in Convex");
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { status: 401 }
      );
    }

    console.log("Authenticated user:", convexUser._id);

    const { url, title, description, favicon } = await req.json();

    if (!url || !title) {
      return NextResponse.json(
        { error: "URL and title are required" },
        { status: 400 }
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
