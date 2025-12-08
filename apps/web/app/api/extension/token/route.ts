import { NextRequest, NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

/**
 * API endpoint to get the Convex auth token for the extension
 * This allows the extension to authenticate requests using the same token as the web app
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
  
  try {
    const token = await convexAuthNextjsToken();

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { 
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Convex tokens typically expire in 7 days, but we'll set it conservatively
    // The extension will check expiration and refresh as needed
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now

    return NextResponse.json({
      token,
      expiresAt,
    }, {
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  } catch (error) {
    console.error("Extension token error:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
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

