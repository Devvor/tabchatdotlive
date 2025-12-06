import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@learnor/convex";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user exists
    let convexUser = await convex.query(api.users.getByClerkId, {
      clerkId,
    });

    // If user doesn't exist, create them
    if (!convexUser) {
      const userId = await convex.mutation(api.users.upsertFromClerk, {
        clerkId,
        email: `${clerkId}@placeholder.local`, // Placeholder - will be updated by webhook
      });

      // Fetch the newly created user
      convexUser = await convex.query(api.users.getByClerkId, {
        clerkId,
      });
    }

    return NextResponse.json({
      success: true,
      user: convexUser,
    });
  } catch (error) {
    console.error("Ensure user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

