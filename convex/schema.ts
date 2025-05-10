import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const fileTypes = v.union(
  v.literal("image"),
  v.literal("csv"),
  v.literal("pdf"),
  v.literal("txt"),
  v.literal("doc"),
);

export const roles = v.union(v.literal("admin"), v.literal("member"));

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: fileTypes,
    orgId: v.string(),
    fileId: v.id("_storage"),
    userId: v.id("users"),
    shouldDelete: v.optional(v.boolean()),
    
  })
    .index("by_orgId", ["orgId"])
    .index("by_shouldDelete", ["shouldDelete"]),
  favorites: defineTable({
    fileId: v.id("files"),
    orgId: v.string(),
    userId: v.id("users"),
  }).index("by_userId_orgId_fileId", ["userId", "orgId", "fileId"]),
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(), // ✅ Added email field
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    orgIds: v.array(
      v.object({
        orgId: v.string(),
        role: roles,
        orgName: v.string(),
      })
    ),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),


  
  logs: defineTable({
    action: v.union(
      v.literal("uploaded"),
      v.literal("deleted"),
      v.literal("favorited"),
      v.literal("unfavorited"),
      v.literal("downloaded"),
      v.literal("restored"),
    ),
    userName: v.string(),      // User who performed the action
    fileName: v.string(),  // ✅ Added file name for better tracking
    orgId: v.string(),         // Organization ID
    fileId: v.id("files"),     // File ID being affected
    hash: v.optional(v.string()), // ✅ Add this line
  })
    .index("by_orgId", ["orgId"]),  // Index to query logs by organization


});