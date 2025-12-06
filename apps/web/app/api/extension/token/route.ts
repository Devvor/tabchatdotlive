import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateToken } from "@/lib/extension-token";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cookie",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Generate a temporary token (valid for 1 hour)
    const { token, expiresAt } = generateToken(clerkId);

    return NextResponse.json(
      {
        token,
        expiresAt,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("Token generation error:", error);
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
