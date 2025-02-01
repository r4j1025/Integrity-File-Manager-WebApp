import { ConvexError, v } from "convex/values";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { fileTypes } from "./schema";
import { Doc, Id } from "./_generated/dataModel";


export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("you must be logged in to upload a file");
  }

  return await ctx.storage.generateUploadUrl();
});

export async function hasAccessToOrg(
  ctx: QueryCtx | MutationCtx,
  orgId: string
) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (!user) {
    return null;
  }

  const hasAccess =
    user.orgIds.some((item) => item.orgId === orgId) ||
    user.tokenIdentifier.includes(orgId);

  if (!hasAccess) {
    return null;
  }

  return { user };
}


export const logDownload = mutation({
  args: {
    fileId: v.id("files"),
    orgId: v.string(),
    fileName: v.string(),
  },
  async handler(ctx, args) {
    await createLog(
      ctx, 
      args.orgId, 
      args.fileId, 
      args.fileName, 
      "downloaded"
    );
  },
});


export async function createLog(
  ctx: MutationCtx,
  orgId: string,
  fileId: Id<"files">,
  fileName: string, // ✅ Include file name in logs
  action: "uploaded" | "deleted" | "favorited" | "unfavorited" | "downloaded" | "restored"
) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("You must be logged in to perform this action");
  }

  // 🔍 Fetch user details
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (!user) {
    throw new ConvexError("User not found");
  }

  // ✅ Insert log with userName
  await ctx.db.insert("logs", {
    action,
    userName: user.name || "Unknown User", // ✅ Use user name
    fileName, // ✅ Include file name
    orgId,
    fileId,
  });
}

export const createFile = mutation({
  args: {
    name: v.string(),
    fileId: v.id("_storage"),
    orgId: v.string(),
    type: fileTypes,
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      throw new ConvexError("you do not have access to this org");
    }

    const file = await ctx.db.insert("files", {
      name: args.name,
      orgId: args.orgId,
      fileId: args.fileId,
      type: args.type,
      userId: hasAccess.user._id,
    });

    await createLog(ctx, args.orgId, file, args.name, "uploaded");



    // let files = await ctx.db
    //   .query("files")
    //   .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
    //   .collect();
  },
});


export const getLogsByOrgId = query({
  args: {
    orgId: v.string(),
  },
  async handler(ctx, args) {
    // Check if the user has access to the organization
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    // Query the logs associated with the given orgId
    const logs = await ctx.db
      .query("logs")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Return the logs
    return logs;
  },
});


export const getFiles = query({
  args: {
    orgId: v.string(),
    query: v.optional(v.string()),
    favorites: v.optional(v.boolean()),
    deletedOnly: v.optional(v.boolean()),
    type: v.optional(fileTypes),
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    let files = await ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const query = args.query;

    if (query) {
      files = files.filter((file) =>
        file.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (args.favorites) {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_userId_orgId_fileId", (q) =>
          q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
        )
        .collect();

      files = files.filter((file) =>
        favorites.some((favorite) => favorite.fileId === file._id)
      );
    }

    if (args.deletedOnly) {
      files = files.filter((file) => file.shouldDelete);
    } else {
      files = files.filter((file) => !file.shouldDelete);
    }

    if (args.type) {
      files = files.filter((file) => file.type === args.type);
    }

    const filesWithUrl = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.fileId),
      }))
    );

  //   const logs = await ctx.db
  //   .query("logs")
  //   .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
  //   .collect();

  // console.log("Logs for orgId:", args.orgId);
  // console.log(logs); // This will log the logs for the orgId

    return filesWithUrl;
  },
});

export const deleteAllFiles = internalMutation({
  args: {},
  async handler(ctx) {
    const files = await ctx.db
      .query("files")
      .withIndex("by_shouldDelete", (q) => q.eq("shouldDelete", true))
      .collect();

    await Promise.all(
      files.map(async (file) => {
        await ctx.storage.delete(file.fileId);
        return await ctx.db.delete(file._id);
      })
    );
  },
});

function assertCanDeleteFile(user: Doc<"users">, file: Doc<"files">) {
  const canDelete =
    file.userId === user._id ||
    user.orgIds.find((org) => org.orgId === file.orgId)?.role === "admin";

  if (!canDelete) {
    throw new ConvexError("you have no acces to delete this file");
  }
}

export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    assertCanDeleteFile(access.user, access.file);

    await ctx.db.patch(args.fileId, {
      shouldDelete: true,
    });

    await createLog(ctx, access.file.orgId, args.fileId, access.file.name, "deleted");

  },
});

export const restoreFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    assertCanDeleteFile(access.user, access.file);

    await ctx.db.patch(args.fileId, {
      shouldDelete: false,
    });

    await createLog(
      ctx,
      access.file.orgId, // orgId from the file access object
      access.file._id,    // fileId of the restored file
      access.file.name,   // fileName of the restored file
      "restored"          // action type
    );
  },
});

export const toggleFavorite = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q
          .eq("userId", access.user._id)
          .eq("orgId", access.file.orgId)
          .eq("fileId", access.file._id)
      )
      .first();

      let action: "favorited" | "unfavorited";

    if (!favorite) {
      await ctx.db.insert("favorites", {
        fileId: access.file._id,
        userId: access.user._id,
        orgId: access.file.orgId,
      });
      action = "favorited";
    } else {
      await ctx.db.delete(favorite._id);
      action = "unfavorited";
    }

    await createLog(ctx, access.file.orgId, access.file._id, access.file.name, action);
  },
});

export const getAllFavorites = query({
  args: { orgId: v.string() },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
      )
      .collect();

    return favorites;
  },
});

async function hasAccessToFile(
  ctx: QueryCtx | MutationCtx,
  fileId: Id<"files">
) {
  const file = await ctx.db.get(fileId);

  if (!file) {
    return null;
  }

  const hasAccess = await hasAccessToOrg(ctx, file.orgId);

  if (!hasAccess) {
    return null;
  }

  return { user: hasAccess.user, file };
}