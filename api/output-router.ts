import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { outputs, sessions } from "@db/schema";

export const outputRouter = createRouter({
  // List user's saved outputs
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(outputs)
      .where(eq(outputs.userId, ctx.user.id))
      .orderBy(desc(outputs.createdAt));
    return rows;
  }),

  // Create a new output
  create: authedQuery
    .input(
      z.object({
        sessionId: z.number(),
        styleField: z.string().optional(),
        lyrics: z.string().optional(),
        excludeField: z.string().optional(),
        weirdness: z.number().optional(),
        styleAccuracy: z.number().optional(),
        audioInfluence: z.number().optional(),
        listenFor: z.array(z.string()).optional(),
        risks: z.array(z.string()).optional(),
        nextStep: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [row] = await db
        .insert(outputs)
        .values({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          styleField: input.styleField,
          lyrics: input.lyrics,
          excludeField: input.excludeField,
          weirdness: input.weirdness,
          styleAccuracy: input.styleAccuracy,
          audioInfluence: input.audioInfluence,
          listenFor: input.listenFor,
          risks: input.risks,
          nextStep: input.nextStep,
        })
        .$returningId();
      return { id: row.id };
    }),

  // Update output (save, rate, etc)
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        userSaved: z.boolean().optional(),
        rating: z.enum(["up", "down"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(outputs)
        .set({
          userSaved: input.userSaved,
          rating: input.rating,
          updatedAt: new Date(),
        })
        .where(and(eq(outputs.id, input.id), eq(outputs.userId, ctx.user.id)));
      return { success: true };
    }),

  // Delete output
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(outputs)
        .where(and(eq(outputs.id, input.id), eq(outputs.userId, ctx.user.id)));
      return { success: true };
    }),
});
