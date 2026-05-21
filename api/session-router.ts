import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sessions, messages } from "../../../../../../db/schema";

export const sessionRouter = createRouter({
  // List user's sessions with message count
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
        .values({ userId: ctx.user.id, title: input.title, mode: "TIM" })
        .$returningId();
      return { id: row.id };
    }),

  // Get session with all messages
  getWithMessages: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [session] = await db.select().from(sessions).where(eq(sessions.id, input.id));
      if (!session) throw new Error("Session not found");
      
      const msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.sessionId, input.id))
        .orderBy(messages.createdAt);
      
      return { session, messages: msgs };
    }),

  // Delete session + messages
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(messages).where(eq(messages.sessionId, input.id));
      await db.delete(sessions).where(eq(sessions.id, input.id));
      return { success: true };
    }),

  // ─── Messages ──────────────────────────────────────────────────────────────
  
  // Save a message
  saveMessage: authedQuery
    .input(z.object({
      sessionId: z.number(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      structuredOutput: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [row] = await db
        .insert(messages)
        .values({
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
          structuredOutput: input.structuredOutput,
        })
        .$returningId();
      return { id: row.id };
    }),

  // Load messages for a session
  loadMessages: authedQuery
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(messages)
        .where(eq(messages.sessionId, input.sessionId))
        .orderBy(messages.createdAt);
      return rows;
    }),
});
