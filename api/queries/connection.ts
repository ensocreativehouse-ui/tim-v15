// ─── LEGACY DRIZZLE CONNECTION — DEPRECATED ──────────────────────────────────
// NOT imported by the current api/timrouter.ts backend.
// The active backend uses Supabase (api/lib/supabase.ts).
// DATABASE_URL is no longer required for T.I.M. to run.

export function getDb(): never {
  throw new Error("Drizzle/MySQL backend is deprecated. Use Supabase (api/lib/supabase.ts) instead.");
}
