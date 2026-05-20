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

// ─── Users (extends Kimi OAuth user) ─────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // T.I.M. tier fields
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
export type InsertUser = typeof users.$inferInsert;

// ─── Sessions (music production sessions) ────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  mode: mysqlEnum("mode", ["TIM"]).default("TIM").notNull(),
  conversationHistory: json("conversationHistory").$type<Record<string, unknown>[]>(),
  currentLayer: int("currentLayer").default(1).notNull(),
  extendChainActive: boolean("extendChainActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

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
export type InsertOutput = typeof outputs.$inferInsert;

// ─── Generation Log (tracks daily usage) ─────────────────────────────────────
export const generationLog = mysqlTable("generationLog", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  tier: mysqlEnum("tier", ["stock", "creator", "pro"]).notNull(),
  prompt: text("prompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationLog = typeof generationLog.$inferSelect;
