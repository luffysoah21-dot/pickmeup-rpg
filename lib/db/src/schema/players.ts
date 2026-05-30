import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username").notNull().default("Player"),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  gold: integer("gold").notNull().default(0),
  heroType: text("hero_type"),
  heroLevel: integer("hero_level").notNull().default(1),
  // نظام تطوير الأبطال الجديد ⬇️
  heroStars: integer("hero_stars").notNull().default(1),
  heroAscension: integer("hero_ascension").notNull().default(0),
  heroSkillLevel: integer("hero_skill_level").notNull().default(1),
  heroFragments: integer("hero_fragments").notNull().default(0),
  skillBooks: integer("skill_books").notNull().default(0),
  ascensionStones: integer("ascension_stones").notNull().default(0),
  // Summon system
  ownedHeroes: text("owned_heroes").notNull().default(""),
  pityEpic: integer("pity_epic").notNull().default(0),
  pityLegendary: integer("pity_legendary").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
