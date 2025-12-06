import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Route handler for ElevenLabs signed URL generation
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const agentId =
      searchParams.get("agentId") || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Get signed URL from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs error:", error);
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      signedUrl: data.signed_url,
    });
  } catch (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
