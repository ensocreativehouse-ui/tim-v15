import { z } from "zod";
import { eq, and, count, gte } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { generationLog, users } from "../../../../../../db/schema";

const TIER_LIMITS: Record<string, number> = {
  stock: 1,
  creator: 3,
  pro: 999,
};

export const generationRouter = createRouter({
  // Check remaining generations for today
  status: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const user = ctx.user;
    const tier = user.tier || "stock";
    const limit = TIER_LIMITS[tier] || 1;

    // Pro tier = unlimited
    if (tier === "pro") {
      return { remaining: 999, limit, tier, trialActive: user.trialActive };
    }

    // Count today's generations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: count() })
      .from(generationLog)
      .where(
        and(
          eq(generationLog.userId, user.id),
          gte(generationLog.createdAt, today)
        )
      );

    const used = result?.count || 0;
    const remaining = Math.max(0, limit - used);

    return {
      remaining,
      limit,
      tier,
      trialActive: user.trialActive,
      trialEndsAt: user.trialEndsAt,
    };
  }),

  // Log a generation
  log: authedQuery
    .input(
      z.object({
        prompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(generationLog).values({
        userId: ctx.user.id,
        tier: ctx.user.tier || "stock",
        prompt: input.prompt,
      });
      return { success: true };
    }),
});
