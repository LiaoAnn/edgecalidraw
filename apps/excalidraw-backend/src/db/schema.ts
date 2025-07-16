import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const room = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  lastActivity: integer("last_activity").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdate(() => sql`(strftime('%s', 'now'))`),
});

export type Room = typeof room.$inferSelect;
export type InsertRoom = typeof room.$inferInsert;

export const libraryItem = sqliteTable("library_items", {
  id: text("id").primaryKey(),
  status: text({ enum: ["published", "unpublished"] }).notNull(),
  elements: text("elements").notNull(), // JSON stringified elements
  created: integer("created").notNull(),
  name: text("name"),
  error: text("error"),
});

export type LibraryItem = typeof libraryItem.$inferSelect;
export type InsertLibraryItem = typeof libraryItem.$inferInsert;
