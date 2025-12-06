import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save a new link
export const create = mutation({
  args: {
    userId: v.id("users"),
    url: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    favicon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if link already exists for this user
    const existingLink = await ctx.db
      .query("links")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();

    if (existingLink && existingLink.userId === args.userId) {
      return existingLink._id;
    }

    return await ctx.db.insert("links", {
      userId: args.userId,
      url: args.url,
      title: args.title,
      description: args.description,
      favicon: args.favicon,
      status: "pending",
      createdAt: Date.now(),
      isRead: false,
    });
  },
});

// Get all links for a user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get all links for a user with their topics
export const getByUserWithTopics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Fetch topics for each link
    const linksWithTopics = await Promise.all(
      links.map(async (link) => {
        const topic = await ctx.db
          .query("topics")
          .withIndex("by_link", (q) => q.eq("linkId", link._id))
          .first();
        return { ...link, topic };
      })
    );
    
    return linksWithTopics;
  },
});

// Get links by status
export const getByUserAndStatus = query({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", args.status)
      )
      .collect();
  },
});

// Get a single link
export const getById = query({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.linkId);
  },
});

// Update link status
export const updateStatus = mutation({
  args: {
    linkId: v.id("links"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, {
      status: args.status,
    });
  },
});

// Update link with processed content
export const updateProcessedContent = mutation({
  args: {
    linkId: v.id("links"),
    processedContent: v.string(),
    contentSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, {
      processedContent: args.processedContent,
      contentSummary: args.contentSummary,
      status: "completed",
      processedAt: Date.now(),
    });
  },
});

// Toggle read status
export const toggleReadStatus = mutation({
  args: {
    linkId: v.id("links"),
    isRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, {
      isRead: args.isRead,
    });
  },
});

// Delete a link
export const remove = mutation({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.linkId);
  },
});
