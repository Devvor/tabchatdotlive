"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";

// Generate a concise one-liner description (max 7 words) from summary
function generateDescription(summary?: string, keyPoints?: string[]): string | undefined {
  if (!summary && !keyPoints) return undefined;

  if (summary) {
    const words = summary.trim().split(/\s+/);
    if (words.length <= 7) {
      return summary.trim();
    }
    return words.slice(0, 7).join(" ");
  }

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

interface Comment {
  author?: string;
  text: string;
}

interface ScrapedData {
  markdown: string;
  articleBody?: string;
  title?: string;
  description?: string;
  summary?: string;
  keyPoints?: string[];
  comments?: Comment[];
}

// Clean markdown by removing images and link-only lines
function cleanMarkdown(markdown: string): string {
  return markdown
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove HTML img tags
    .replace(/<img[^>]*>/gi, '')
    // Remove empty lines left behind
    .replace(/\n{3,}/g, '\n\n')
    // Remove link-only lines (like footer link lists)
    .replace(/^\s*\[.*?\]\(.*?\)\s*$/gm, '')
    .trim();
}

async function scrapeAndExtract(url: string): Promise<ScrapedData | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error("FIRECRAWL_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "extract"],
        onlyMainContent: true,
        // Exclude non-content elements
        excludeTags: [
          "img", "figure", "figcaption", 
          "aside", "footer", "nav", 
          "iframe", "video", "audio",
          "script", "style", "noscript",
          "svg", "canvas"
        ],
        extract: {
          schema: {
            type: "object",
            properties: {
              title: { 
                type: "string",
                description: "The main headline/title of the article"
              },
              articleBody: {
                type: "string",
                description: "The full body text of the article. Include all paragraphs and sections of the main content. Do not include navigation, sidebars, advertisements, or footer content."
              },
              description: {
                type: "string",
                description: "A concise one-liner hook summarizing the article's main message. Maximum 7 words.",
              },
              summary: { 
                type: "string",
                description: "A comprehensive summary of the article in 2-3 sentences."
              },
              keyPoints: {
                type: "array",
                items: { type: "string" },
                description: "The main key points or takeaways from the article."
              },
              comments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    author: { type: "string" },
                    text: { type: "string" }
                  },
                  required: ["text"]
                },
                description: "User comments on the article, if a comment section exists. Return empty array if no comments."
              },
            },
            required: ["title", "articleBody", "summary", "keyPoints"],
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Firecrawl error:", errorText);
      return null;
    }

    const data = await response.json();
    const rawMarkdown = data.data?.markdown || "";
    const articleBody = data.data?.extract?.articleBody;
    
    const extracted: ScrapedData = {
      // Prefer articleBody, fall back to cleaned markdown
      markdown: articleBody || cleanMarkdown(rawMarkdown),
      articleBody: articleBody,
      title: data.data?.extract?.title || data.data?.metadata?.title,
      description: data.data?.extract?.description,
      summary: data.data?.extract?.summary,
      keyPoints: data.data?.extract?.keyPoints,
      comments: data.data?.extract?.comments || [],
    };

    // Generate description if not provided by Firecrawl
    if (!extracted.description) {
      extracted.description = generateDescription(
        extracted.summary,
        extracted.keyPoints
      );
    }

    return extracted;
  } catch (error) {
    console.error("Scrape error:", error);
    return null;
  }
}

// Main scraping action
export const scrapeLink = internalAction({
  args: {
    linkId: v.id("links"),
    userId: v.id("users"),
    url: v.string(),
    title: v.string(),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { linkId, userId, url, title, retryCount = 0 } = args;
    const MAX_RETRIES = 3;

    console.log(`Scraping link ${linkId} (attempt ${retryCount + 1})`);

    // Update status to processing
    await ctx.runMutation(internal.links.internalUpdateStatus, {
      linkId,
      status: "processing",
    });

    // Scrape the URL
    const extracted = await scrapeAndExtract(url);

    if (extracted && extracted.summary && extracted.keyPoints) {
      // Success! Update link with all processed content
      await ctx.runMutation(internal.links.internalUpdateWithTopicData, {
        linkId,
        processedContent: extracted.markdown,
        contentSummary: extracted.summary,
        title: extracted.title || title,  // Update title if AI extracted a better one
        topicDescription: extracted.description,  // 7-word hook
        keyPoints: extracted.keyPoints,
      });

      console.log(`Successfully processed link ${linkId}`);
    } else {
      // Failed to scrape
      if (retryCount < MAX_RETRIES) {
        // Schedule a retry with exponential backoff
        const delayMs = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
        console.log(
          `Scheduling retry ${retryCount + 1} for link ${linkId} in ${delayMs}ms`
        );

        await ctx.scheduler.runAfter(delayMs, internal.actions.scrapeLink.scrapeLink, {
          linkId,
          userId,
          url,
          title,
          retryCount: retryCount + 1,
        });
      } else {
        // Max retries reached, mark as failed
        console.error(
          `Failed to scrape link ${linkId} after ${MAX_RETRIES} retries`
        );
        await ctx.runMutation(internal.links.internalUpdateStatus, {
          linkId,
          status: "failed",
        });
      }
    }
  },
});

// Retry failed links (can be called by cron or manually)
export const retryFailedLinks = internalAction({
  args: {},
  handler: async (ctx) => {
    const failedLinks = await ctx.runQuery(internal.links.getFailedLinks, {});

    console.log(`Found ${failedLinks.length} failed links to retry`);

    for (const link of failedLinks) {
      await ctx.scheduler.runAfter(0, internal.actions.scrapeLink.scrapeLink, {
        linkId: link._id,
        userId: link.userId,
        url: link.url,
        title: link.title,
        retryCount: 0,
      });
    }
  },
});
