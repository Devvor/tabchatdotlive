export interface ScrapeResult {
  success: boolean;
  data?: {
    markdown: string;
    metadata: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
    };
    extract?: {
      title?: string;
      summary?: string;
      keyPoints?: string[];
      topics?: string[];
    };
  };
  error?: string;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    const response = await fetch("/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "Failed to scrape" };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Re-export generateTeacherPrompt from vapi.ts for backwards compatibility
export { generateTeacherPrompt } from "./vapi";
