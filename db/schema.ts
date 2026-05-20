import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  json,
  bigint,
  boolean,
  date,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  tier: mysqlEnum("tier", ["stock", "creator", "pro"]).default("stock").notNull(),
  trialActive: boolean("trialActive").default(false).notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  dailyGenerations: int("dailyGenerations").default(0).notNull(),
  lastGenerationDate: date("lastGenerationDate"),
  onboarded: boolean("onboarded").default(false).notNull(),
  firstCreateVisit: boolean("firstCreateVisit").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

// ─── Sessions (conversation sessions) ────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  mode: mysqlEnum("mode", ["TIM"]).default("TIM").notNull(),
  currentLayer: int("currentLayer").default(1).notNull(),
  extendChainActive: boolean("extendChainActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Session = typeof sessions.$inferSelect;

// ─── Messages (chat messages per session) ────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: bigint("sessionId", { mode: "number", unsigned: true }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  structuredOutput: json("structuredOutput"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;

// ─── Outputs (generated tracks) ──────────────────────────────────────────────
export const outputs = mysqlTable("outputs", {
  id: serial("id").primaryKey(),
  sessionId: bigint("sessionId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  layerNumber: int("layerNumber").default(1).notNull(),
  styleField: text("styleField"),
  lyrics: text("lyrics"),
  excludeField: text("excludeField"),
  weirdness: int("weirdness").default(48),
  styleAccuracy: int("styleAccuracy").default(87),
  audioInfluence: int("audioInfluence").default(0),
  listenFor: json("listenFor").$type<string[]>(),
  risks: json("risks").$type<string[]>(),
  nextStep: text("nextStep"),
  userSaved: boolean("userSaved").default(false).notNull(),
  rating: mysqlEnum("rating", ["up", "down"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Output = typeof outputs.$inferSelect;

// ─── Generation Log ──────────────────────────────────────────────────────────
export const generationLog = mysqlTable("generationLog", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  tier: mysqlEnum("tier", ["stock", "creator", "pro"]).notNull(),
  prompt: text("prompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
