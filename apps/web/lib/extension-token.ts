import crypto from "crypto";

// Store temporary tokens (in production, use Redis or similar)
const tokenStore = new Map<string, { clerkId: string; expiresAt: number }>();

// Clean up expired tokens periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    tokenStore.forEach((data, token) => {
      if (data.expiresAt < now) {
        tokenStore.delete(token);
      }
    });
  }, 5 * 60 * 1000);
}

export function generateToken(clerkId: string): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
  tokenStore.set(token, { clerkId, expiresAt });
  return { token, expiresAt };
}

export function verifyToken(token: string): string | null {
  const data = tokenStore.get(token);
  if (!data) {
    return null;
  }
  if (data.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  return data.clerkId;
}

