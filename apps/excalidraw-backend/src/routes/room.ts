import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { room } from "../db/schema";
import { eq, desc } from "drizzle-orm";

// 輔助函數：從標題中提取英文部分並生成房間 ID
function generateRoomId(title: string): string {
  // 將標題轉換為小寫
  let englishTitle = title.toLowerCase().trim();

  // 移除所有非英文字母、數字、空格、連字符和底線的字符（包括中文）
  englishTitle = englishTitle.replace(/[^a-z0-9\-_\s]/g, "");

  // 將空格替換為連字符
  englishTitle = englishTitle.replace(/\s+/g, "-");

  // 移除多餘的連字符
  englishTitle = englishTitle.replace(/-+/g, "-").replace(/^-|-$/g, "");

  // 如果轉換後為空，使用預設值
  if (!englishTitle) {
    englishTitle = "room";
  }

  // 生成唯一 ID
  const uid = Math.random().toString(36).substring(2, 8);

  return `${englishTitle}-${uid}`;
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

// 獲取所有房間列表的 API
app.get("/", async (c) => {
  try {
    const db = drizzle(c.env.DB);
    const allRooms = await db
      .select()
      .from(room)
      .orderBy(desc(room.lastActivity));

    // 轉換時間戳為 ISO 字串格式供前端使用
    const formattedRooms = allRooms.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: new Date(r.createdAt * 1000).toISOString(),
      lastActivity: new Date(r.lastActivity * 1000).toISOString(),
    }));

    return c.json({ rooms: formattedRooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return c.json({ error: "獲取房間列表失敗" }, 500);
  }
});

// 創建房間的 API
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const title = body.title;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return c.json({ error: "標題是必填欄位" }, 400);
    }

    const roomId = generateRoomId(title);
    const now = Math.floor(Date.now() / 1000); // 轉換為秒級時間戳以符合 schema

    const db = drizzle(c.env.DB);

    // 插入新房間到資料庫並返回插入的資料
    const [insertedRoom] = await db
      .insert(room)
      .values({
        id: roomId,
        name: title.trim(),
        lastActivity: now,
      })
      .returning();

    const newRoom = {
      id: insertedRoom.id,
      name: insertedRoom.name,
      createdAt: new Date(insertedRoom.createdAt * 1000).toISOString(), // 轉換為 ISO 格式供前端使用
      lastActivity: new Date(insertedRoom.lastActivity * 1000).toISOString(),
    };

    console.log("Created new room:", newRoom);

    return c.json({
      success: true,
      roomId: roomId,
      room: newRoom,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return c.json({ error: "創建房間失敗" }, 500);
  }
});

// 檢查房間是否存在的 API
app.get("/:roomId/exists", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const db = drizzle(c.env.DB);

    // 檢查房間是否存在
    const existingRoom = await db
      .select()
      .from(room)
      .where(eq(room.id, roomId))
      .limit(1);

    const exists = existingRoom.length > 0;

    return c.json({
      exists,
      room: exists
        ? {
            id: existingRoom[0].id,
            name: existingRoom[0].name,
            createdAt: new Date(existingRoom[0].createdAt * 1000).toISOString(),
            lastActivity: new Date(
              existingRoom[0].lastActivity * 1000
            ).toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking room existence:", error);
    return c.json({ error: "檢查房間存在性失敗" }, 500);
  }
});

// 更新房間活動時間的 API
app.patch("/:roomId/activity", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const now = Math.floor(Date.now() / 1000); // 轉換為秒級時間戳

    const db = drizzle(c.env.DB);

    // 更新房間的最後活動時間並返回更新後的資料
    const [updatedRoom] = await db
      .update(room)
      .set({ lastActivity: now })
      .where(eq(room.id, roomId))
      .returning();

    if (!updatedRoom) {
      return c.json({ error: "房間不存在" }, 404);
    }

    const formattedRoom = {
      id: updatedRoom.id,
      name: updatedRoom.name,
      createdAt: new Date(updatedRoom.createdAt * 1000).toISOString(), // 轉換為 ISO 格式
      lastActivity: new Date(updatedRoom.lastActivity * 1000).toISOString(),
    };

    return c.json({
      success: true,
      room: formattedRoom,
    });
  } catch (error) {
    console.error("Error updating room activity:", error);
    return c.json({ error: "更新房間活動時間失敗" }, 500);
  }
});

// 刪除房間的 API
app.delete("/:roomId", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const db = drizzle(c.env.DB);

    // 首先檢查房間是否存在
    const existingRoom = await db
      .select()
      .from(room)
      .where(eq(room.id, roomId))
      .limit(1);

    if (existingRoom.length === 0) {
      return c.json({ error: "房間不存在" }, 404);
    }

    // 清除 durable object 中的資料
    try {
      // TODO: clear room data in durable object
    } catch (error) {
      console.error("Error clearing durable object data:", error);
      // 即使清除 durable object 失敗，我們仍然繼續刪除資料庫記錄
    }

    // 從資料庫中刪除房間
    const [deletedRoom] = await db
      .delete(room)
      .where(eq(room.id, roomId))
      .returning();

    return c.json({
      success: true,
      deletedRoom: {
        id: deletedRoom.id,
        name: deletedRoom.name,
      },
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return c.json({ error: "刪除房間失敗" }, 500);
  }
});

export default app;
