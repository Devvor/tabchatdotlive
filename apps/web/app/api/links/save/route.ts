import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@tabchatdotlive/convex";
import { jwtDecode } from "jwt-decode";

interface ClerkJwtPayload {
  sub: string; // Clerk user ID
  iss: string;
  aud?: string;
  exp: number;
}

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
    // Create a ConvexHttpClient instance (without auth for direct queries by clerk ID)
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    let clerkUserId: string | null = null;
    
    // Check for Authorization header first (for extension requests)
    const authHeader = req.headers.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log("Using token from Authorization header");
      
      // Decode the JWT to get the Clerk user ID
      try {
        const decoded = jwtDecode<ClerkJwtPayload>(token);
        
        // Validate the token hasn't expired
        if (decoded.exp * 1000 < Date.now()) {
          console.error("Token has expired");
          return NextResponse.json(
            { 
              error: "Token expired. Please sign in again.",
              code: "TOKEN_EXPIRED"
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
        
        clerkUserId = decoded.sub;
        console.log("Decoded Clerk user ID from token:", clerkUserId);
      } catch (decodeError) {
        console.error("Failed to decode token:", decodeError);
        return NextResponse.json(
          { 
            error: "Invalid token format",
            code: "INVALID_TOKEN"
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
    } else {
      // Fall back to cookie-based auth (for web app requests)
      const { userId } = await auth();
      if (userId) {
        clerkUserId = userId;
        console.log("Using Clerk user ID from session:", clerkUserId);
      }
    }

    if (!clerkUserId) {
      console.error("No auth found");
      
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

    // Look up user in Convex by their Clerk ID (doesn't require Convex auth)
    let convexUser;
    try {
      convexUser = await convex.query(api.users.getByClerkId, { clerkId: clerkUserId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "";
      console.error("Error querying user:", errorMessage);
      throw error;
    }

    if (!convexUser) {
      console.error("User not found in Convex for Clerk ID:", clerkUserId);
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

    console.log("Found user in Convex:", convexUser._id);

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
