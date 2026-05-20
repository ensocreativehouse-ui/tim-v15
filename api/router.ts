import { authRouter } from "./auth-router";
import { agentRouter } from "./agent-router";
import { outputRouter } from "./output-router";
import { generationRouter } from "./generation-router";
import { sessionRouter } from "./session-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  agent: agentRouter,
  output: outputRouter,
  generation: generationRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
