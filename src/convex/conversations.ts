import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("conversations")
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      title: args.title,
      model: args.model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      content: args.content,
      role: args.role,
      model: args.model,
      timestamp: Date.now(),
    });
  },
});
