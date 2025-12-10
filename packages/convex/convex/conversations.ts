import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new conversation
export const create = mutation({
  args: {
    userId: v.id("users"),
    linkId: v.optional(v.id("links")),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: args.userId,
      linkId: args.linkId,
      title: args.title,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all conversations for a user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get active conversations
export const getActiveByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .order("desc")
      .collect();
  },
});

// Get a single conversation with messages
export const getWithMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return { ...conversation, messages };
  },
});

// Update conversation status
export const updateStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// Add a message to conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    audioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      audioUrl: args.audioUrl,
      createdAt: Date.now(),
    });
  },
});

// Delete a conversation and its messages
export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Delete all messages first
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});

