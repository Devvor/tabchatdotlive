import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@tabchatdotlive/convex";
import { verifyToken } from "@/lib/extension-token";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";

// Generate a concise one-liner description (max 7 words) from summary
function generateDescription(summary?: string, keyPoints?: string[]): string | undefined {
  if (!summary && !keyPoints) return undefined;
  
  // Try to extract from summary first
  if (summary) {
    const words = summary.trim().split(/\s+/);
    if (words.length <= 7) {
      return summary.trim();
    }
    // Take first 7 words
    return words.slice(0, 7).join(" ");
  }
  
  // Fallback to first key point if available
  if (keyPoints && keyPoints.length > 0) {
    const firstPoint = keyPoints[0].trim();
    const words = firstPoint.split(/\s+/);
    if (words.length <= 7) {
      return firstPoint;
    }
    return words.slice(0, 7).join(" ");
  }
  
  return undefined;
}

async function scrapeAndExtract(url: string): Promise<{
  markdown: string;
  title?: string;
  description?: string;
  summary?: string;
  keyPoints?: string[];
} | null> {
  try {
    const response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "extract"],
        onlyMainContent: true,
        extract: {
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { 
                type: "string",
                description: "A concise one-liner epic point summarizing the article's main message. Maximum 7 words."
              },
              summary: { type: "string" },
              keyPoints: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["title", "summary", "keyPoints"],
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("Firecrawl error:", await response.text());
      return null;
    }

    const data = await response.json();
    const extracted = {
      markdown: data.data?.markdown || "",
      title: data.data?.extract?.title || data.data?.metadata?.title,
      description: data.data?.extract?.description,
      summary: data.data?.extract?.summary,
      keyPoints: data.data?.extract?.keyPoints,
    };
    
    // Generate description if not provided by Firecrawl
    if (!extracted.description) {
      extracted.description = generateDescription(extracted.summary, extracted.keyPoints);
    }
    
    return extracted;
  } catch (error) {
    console.error("Scrape error:", error);
    return null;
  }
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

    // Scrape and create topic in background (don't wait for it)
    scrapeAndExtract(url).then(async (extracted) => {
      if (extracted && extracted.summary && extracted.keyPoints) {
        try {
          // Update link status to completed
          await convex.mutation(api.links.updateProcessedContent, {
            linkId,
            processedContent: extracted.markdown,
            contentSummary: extracted.summary,
          });

          // Create topic with summary, description, and key points
          await convex.mutation(api.topics.create, {
            userId: convexUser!._id,
            linkId,
            name: extracted.title || title,
            description: extracted.description,
            summary: extracted.summary,
            keyPoints: extracted.keyPoints,
          });

          console.log("Topic created for link:", linkId);
        } catch (error) {
          console.error("Failed to create topic:", error);
          // Mark link as failed
          await convex.mutation(api.links.updateStatus, {
            linkId,
            status: "failed",
          });
        }
      } else {
        // Mark link as failed if extraction didn't work
        await convex.mutation(api.links.updateStatus, {
          linkId,
          status: "failed",
        });
      }
    }).catch((error) => {
      console.error("Background scrape failed:", error);
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
