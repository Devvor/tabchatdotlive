import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Test endpoint to check if auth is working
export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    const clerkId = authResult.userId;
    
    const cookieHeader = req.headers.get("cookie");
    
    return NextResponse.json(
      {
        authenticated: !!clerkId,
        clerkId: clerkId || null,
        hasCookies: !!cookieHeader,
        cookiePreview: cookieHeader?.substring(0, 200) || null,
        headers: Object.fromEntries(
          Array.from(req.headers.entries()).filter(([key]) => 
            key.toLowerCase().includes('cookie') || key.toLowerCase().includes('authorization')
          )
        ),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
        authenticated: false,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

