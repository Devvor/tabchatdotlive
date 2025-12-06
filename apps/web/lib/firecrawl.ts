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

export function generateTeacherPrompt(
  content: string,
  metadata?: {
    title?: string;
    summary?: string;
    keyPoints?: string[];
  }
): string {
  const keyPointsList = metadata?.keyPoints?.map((p) => `- ${p}`).join("\n") || "";

  return `You are an expert AI teacher helping a student learn about the following topic.

TOPIC: ${metadata?.title || "Learning Material"}

SUMMARY: ${metadata?.summary || "No summary available"}

KEY POINTS TO COVER:
${keyPointsList || "- General understanding of the topic"}

SOURCE CONTENT:
${content.slice(0, 8000)}

INSTRUCTIONS:
1. You are a patient, encouraging, and knowledgeable teacher
2. Explain concepts clearly using simple language and analogies
3. Ask follow-up questions to check understanding
4. Provide examples when helpful
5. If the student seems confused, try explaining from a different angle
6. Be conversational and engaging - this is a voice conversation
7. Keep responses concise but informative (aim for 2-3 sentences when possible)
8. If asked about something not in the content, acknowledge you don't have that specific information

Start by introducing the topic briefly and asking what aspect the student would like to explore first.`;
}

