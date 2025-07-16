import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { libraryItem } from "../db/schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const items = await db.select().from(libraryItem);
  return c.json({
    libraryItems: items.map((item) => ({
      ...item,
      elements: JSON.parse(item.elements), // Parse JSON stringified elements
    })),
  });
});

// can't use drizzle-zod, so define the schema manually
// https://github.com/drizzle-team/drizzle-orm/issues/4406
const libraryItemSchema = z.object({
  id: z.string(),
  status: z.enum(["published", "unpublished"]),
  elements: z.array(z.any()),
  created: z.number(),

  // will be undefined if insert, null if update
  name: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});
const libraryItemsSchema = z.array(libraryItemSchema);

// update or insert library items into the database
// libraryItems will contain all items, including those that are not in the database
app.post(
  "/",
  zValidator(
    "json",
    z.object({
      libraryItems: libraryItemsSchema,
    })
  ),
  async (c) => {
    const validated = c.req.valid("json");
    const { libraryItems: inputLibraryItems } = validated as {
      libraryItems: z.infer<typeof libraryItemsSchema>;
    };

    const db = drizzle(c.env.DB);
    const dbLibraryItems = await db.select().from(libraryItem);

    const inputLibraryItemIds = new Set(
      inputLibraryItems.map((item) => item.id)
    );
    const dbLibraryItemIds = new Set(dbLibraryItems.map((item) => item.id));
    const allLibraryItemIds = new Set([
      ...inputLibraryItemIds,
      ...dbLibraryItemIds,
    ]);

    // 3 cases:
    // 1. If input item exists and is in the database, ignore it.
    // 2. If input item exists and is not in the database, insert it.
    // 3. If input item deleted, but db has an item with the same id, delete from the db.
    const promises = [];
    let insertCount = 0;
    let deleteCount = 0;
    for (const item of allLibraryItemIds) {
      const inputItemExists = inputLibraryItemIds.has(item);
      const dbItemExists = dbLibraryItemIds.has(item);

      // 1. If input item exists and is in the database, ignore it.
      if (inputItemExists && dbItemExists) {
        // Do nothing
      }
      // 2. If input item exists and is not in the database, insert it.
      else if (inputItemExists && !dbItemExists) {
        const itemData = inputLibraryItems.find((i) => i.id === item);
        if (!itemData) continue;

        insertCount++;
        promises.push(
          db.insert(libraryItem).values({
            ...itemData,
            elements: JSON.stringify(itemData.elements),
          })
        );
      }
      // 3. If input item deleted, but db has an item with the same id, delete from the db.
      else if (!inputItemExists && dbItemExists) {
        deleteCount++;
        promises.push(db.delete(libraryItem).where(eq(libraryItem.id, item)));
      }
    }

    await Promise.all(promises);

    return c.json({
      success: true,
      insertCount,
      deleteCount,
    });
  }
);

export default app;
