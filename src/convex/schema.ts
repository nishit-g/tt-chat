import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  conversations: defineTable({
    title: v.string(),
    model: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_updated", ["updatedAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    model: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_conversation", ["conversationId", "timestamp"]),

  images: defineTable({
    conversationId: v.id("conversations"),
    prompt: v.string(),
    url: v.string(),
    model: v.string(),
    timestamp: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
