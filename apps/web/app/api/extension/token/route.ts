import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * API endpoint to get the Clerk session token for the extension
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
    const { getToken, userId } = await auth();

    if (!userId) {
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

    // Get a token that can be used with Convex
    const token = await getToken({ template: "convex" });

    if (!token) {
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

    // Clerk tokens typically expire in 60 seconds, but we'll set it conservatively
    // The extension will check expiration and refresh as needed
    const expiresAt = Date.now() + 55 * 1000; // 55 seconds from now

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
