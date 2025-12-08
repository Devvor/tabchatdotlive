import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

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

// Get paginated links for a user
export const getByUserPaginated = query({
  args: {
    userId: v.id("users"),
    paginationOpts: v.object({
      cursor: v.optional(v.string()),
      numItems: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { cursor, numItems = 20 } = args.paginationOpts;

    const results = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate({ cursor: cursor ?? null, numItems });

    // Transform results to include topic data
    const itemsWithTopics = results.page.map((link) => {
      if (link.summary || link.keyPoints) {
        return {
          ...link,
          topic: {
            _id: link._id,
            userId: link.userId,
            linkId: link._id,
            name: link.topicName || link.title,
            description: link.topicDescription || link.description,
            summary: link.summary || "",
            keyPoints: link.keyPoints || [],
            createdAt: link.processedAt || link.createdAt,
          },
        };
      }
      return { ...link, topic: null };
    });

    return {
      items: itemsWithTopics,
      cursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

// Get all links for a user with their topics
// Now returns topic data from the link itself (no more N+1 queries!)
export const getByUserWithTopics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Transform to include topic object for backwards compatibility with UI
    return links.map((link) => {
      // If link has new topic fields, use them
      if (link.summary || link.keyPoints) {
        return {
          ...link,
          topic: {
            _id: link._id, // Use link ID as topic ID for compatibility
            userId: link.userId,
            linkId: link._id,
            name: link.topicName || link.title,
            description: link.topicDescription || link.description,
            summary: link.summary || "",
            keyPoints: link.keyPoints || [],
            createdAt: link.processedAt || link.createdAt,
          },
        };
      }
      // For legacy links without new fields, return null topic
      // (the UI will fall back to querying the topics table)
      return { ...link, topic: null };
    });
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

// ============ Internal functions for Convex Actions ============

// Internal: Update link status (for actions)
export const internalUpdateStatus = internalMutation({
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

// Internal: Update link with processed content (for actions)
export const internalUpdateProcessedContent = internalMutation({
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

// Internal: Update link with all topic data (new consolidated approach)
export const internalUpdateWithTopicData = internalMutation({
  args: {
    linkId: v.id("links"),
    processedContent: v.string(),
    contentSummary: v.optional(v.string()),
    topicName: v.optional(v.string()),
    topicDescription: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, {
      processedContent: args.processedContent,
      contentSummary: args.contentSummary,
      topicName: args.topicName,
      topicDescription: args.topicDescription,
      summary: args.summary,
      keyPoints: args.keyPoints,
      status: "completed",
      processedAt: Date.now(),
    });
  },
});

// Internal: Get all failed links (for retry action)
export const getFailedLinks = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("links")
      .filter((q) => q.eq(q.field("status"), "failed"))
      .collect();
  },
});

// Create a link and schedule scraping
export const createAndScrape = mutation({
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

    // Create the link
    const linkId = await ctx.db.insert("links", {
      userId: args.userId,
      url: args.url,
      title: args.title,
      description: args.description,
      favicon: args.favicon,
      status: "pending",
      createdAt: Date.now(),
      isRead: false,
    });

    // Schedule the scraping action
    await ctx.scheduler.runAfter(0, internal.actions.scrapeLink.scrapeLink, {
      linkId,
      userId: args.userId,
      url: args.url,
      title: args.title,
    });

    return linkId;
  },
});
