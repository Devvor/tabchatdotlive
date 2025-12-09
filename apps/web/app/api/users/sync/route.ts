import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@tabchatdotlive/convex";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * API endpoint to manually sync the current Clerk user to Convex
 * Useful for local development when webhooks point to production
 * 
 * Usage: Just visit /api/users/sync while logged in
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated. Please sign in first." },
        { status: 401 }
      );
    }

    // Get the full user details from Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Could not fetch user details from Clerk" },
        { status: 500 }
      );
    }

    // Get primary email
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );

    if (!primaryEmail) {
      return NextResponse.json(
        { error: "User has no primary email address" },
        { status: 400 }
      );
    }

    // Build name from first/last name
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;

    // Upsert user in Convex (same logic as webhook)
    const convexUserId = await convex.mutation(api.users.upsertFromClerk, {
      clerkId: user.id,
      email: primaryEmail.emailAddress,
      name,
      imageUrl: user.imageUrl,
    });

    return NextResponse.json({
      success: true,
      message: "User synced successfully!",
      clerkId: user.id,
      convexUserId,
      email: primaryEmail.emailAddress,
      name,
    });
  } catch (error) {
    console.error("User sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user", details: String(error) },
      { status: 500 }
    );
  }
}

