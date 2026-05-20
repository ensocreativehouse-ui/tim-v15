import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sessions } from "@db/schema";

export const sessionRouter = createRouter({
  // List user's sessions
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, ctx.user.id))
      .orderBy(desc(sessions.updatedAt));
    return rows;
  }),

  // Create a new session
  create: authedQuery
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [row] = await db
        .insert(sessions)
        .values({
          userId: ctx.user.id,
          title: input.title,
          mode: "TIM",
        })
        .$returningId();
      return { id: row.id };
    }),

  // Update session
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        currentLayer: z.number().optional(),
        extendChainActive: z.boolean().optional(),
        conversationHistory: z.array(z.record(z.unknown())).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;
      await db
        .update(sessions)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(sessions.id, id));
      return { success: true };
    }),

  // Delete session
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(sessions).where(eq(sessions.id, input.id));
      return { success: true };
    }),
});
