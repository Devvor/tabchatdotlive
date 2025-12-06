import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@learnor/convex";
import { Id } from "@learnor/convex";

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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkId } = await req.json();

    if (!linkId) {
      return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
    }

    // Get the link
    const link = await convex.query(api.links.getById, {
      linkId: linkId as Id<"links">,
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Get the user
    const convexUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    if (!convexUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user owns this link
    if (link.userId !== convexUser._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update status to processing
    await convex.mutation(api.links.updateStatus, {
      linkId: linkId as Id<"links">,
      status: "processing",
    });

    // Scrape the URL
    const extracted = await scrapeAndExtract(link.url);

    if (extracted && extracted.summary && extracted.keyPoints) {
      // Update link with processed content
      await convex.mutation(api.links.updateProcessedContent, {
        linkId: linkId as Id<"links">,
        processedContent: extracted.markdown,
        contentSummary: extracted.summary,
      });

      // Check if topic already exists
      const existingTopic = await convex.query(api.topics.getByLink, {
        linkId: linkId as Id<"links">,
      });

      if (existingTopic) {
        // Update existing topic
        await convex.mutation(api.topics.update, {
          topicId: existingTopic._id,
          name: extracted.title || link.title,
          description: extracted.description,
          summary: extracted.summary,
          keyPoints: extracted.keyPoints,
        });
      } else {
        // Create new topic
        await convex.mutation(api.topics.create, {
          userId: convexUser._id,
          linkId: linkId as Id<"links">,
          name: extracted.title || link.title,
          description: extracted.description,
          summary: extracted.summary,
          keyPoints: extracted.keyPoints,
        });
      }

      return NextResponse.json({
        success: true,
        summary: extracted.summary,
        keyPoints: extracted.keyPoints,
      });
    } else {
      // Mark as failed
      await convex.mutation(api.links.updateStatus, {
        linkId: linkId as Id<"links">,
        status: "failed",
      });

      return NextResponse.json(
        { error: "Failed to extract content from URL" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Process link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

