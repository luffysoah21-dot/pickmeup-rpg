import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";

export const battlesTable = pgTable("battles", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id),
  monsterName: text("monster_name").notNull(),
  result: text("result").notNull(), // "win" | "lose"
  expGained: integer("exp_gained").notNull().default(0),
  goldGained: integer("gold_gained").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBattleSchema = createInsertSchema(battlesTable).omit({ id: true, createdAt: true });
export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type Battle = typeof battlesTable.$inferSelect;
