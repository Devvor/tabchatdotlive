import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced from Clerk via webhooks
  users: defineTable({
    clerkId: v.string(), // Clerk user ID (required, primary identifier)
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    imageUrl: v.optional(v.string()), // Alias for image
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Saved links from browser extension
  // Now includes topic fields directly (previously in separate topics table)
  links: defineTable({
    userId: v.id("users"),
    url: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    favicon: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    processedContent: v.optional(v.string()),
    contentSummary: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    isRead: v.optional(v.boolean()),
    // Topic fields (merged from topics table)
    topicName: v.optional(v.string()),
    topicDescription: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_status", ["status"])
    .index("by_user_and_url", ["userId", "url"]),

  // Conversations with AI teacher
  conversations: defineTable({
    userId: v.id("users"),
    linkId: v.optional(v.id("links")),
    title: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Messages within conversations
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    audioUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
