import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a topic from processed link
export const create = mutation({
  args: {
    userId: v.id("users"),
    linkId: v.id("links"),
    name: v.string(),
    summary: v.string(),
    keyPoints: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("topics", {
      userId: args.userId,
      linkId: args.linkId,
      name: args.name,
      summary: args.summary,
      keyPoints: args.keyPoints,
      createdAt: Date.now(),
    });
  },
});

// Get all topics for a user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get topic by link
export const getByLink = query({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topics")
      .withIndex("by_link", (q) => q.eq("linkId", args.linkId))
      .first();
  },
});

// Get a single topic with its link
export const getWithLink = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) return null;

    const link = await ctx.db.get(topic.linkId);
    return { ...topic, link };
  },
});

// Update topic
export const update = mutation({
  args: {
    topicId: v.id("topics"),
    name: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { topicId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(topicId, filteredUpdates);
  },
});

// Delete a topic
export const remove = mutation({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.topicId);
  },
});

