import { Hono } from "hono";

// 房間數據結構
interface Room {
  id: string;
  name: string;
  createdAt: string;
  lastActivity: string;
  participantCount: number;
}

// 記憶體中的房間存儲（在實際應用中應該使用數據庫或 Durable Objects）
let rooms: Room[] = [
  {
    id: "design-meeting",
    name: "設計討論室",
    createdAt: "2025-07-04T10:00:00Z",
    lastActivity: "2025-07-04T12:30:00Z",
    participantCount: 3,
  },
  {
    id: "product-planning",
    name: "產品規劃",
    createdAt: "2025-07-04T09:15:00Z",
    lastActivity: "2025-07-04T11:45:00Z",
    participantCount: 5,
  },
  {
    id: "architecture-design",
    name: "架構設計",
    createdAt: "2025-07-03T14:20:00Z",
    lastActivity: "2025-07-04T10:15:00Z",
    participantCount: 2,
  },
  {
    id: "brainstorming",
    name: "腦力激盪",
    createdAt: "2025-07-04T08:30:00Z",
    lastActivity: "2025-07-04T09:00:00Z",
    participantCount: 1,
  },
];

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

// 新增：獲取所有房間列表的 API
app.get("/api/rooms", async (c) => {
  // 按最後活動時間降序排列
  const sortedRooms = [...rooms].sort(
    (a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  return c.json({ rooms: sortedRooms });
});

// 新增：創建房間的 API
app.post("/api/rooms", async (c) => {
  try {
    const body = await c.req.json();
    const title = body.title;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return c.json({ error: "標題是必填欄位" }, 400);
    }

    const roomId = generateRoomId(title);
    const now = new Date().toISOString();

    const newRoom: Room = {
      id: roomId,
      name: title.trim(),
      createdAt: now,
      lastActivity: now,
      participantCount: 0,
    };

    // 將新房間添加到房間列表
    rooms.push(newRoom);

    console.log("Created new room:", newRoom);
    console.log("Total rooms:", rooms.length);

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

// 新增：更新房間活動時間的 API
app.patch("/api/rooms/:roomId/activity", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const roomIndex = rooms.findIndex((room) => room.id === roomId);

    if (roomIndex === -1) {
      return c.json({ error: "房間不存在" }, 404);
    }

    // 更新最後活動時間
    rooms[roomIndex].lastActivity = new Date().toISOString();

    return c.json({
      success: true,
      room: rooms[roomIndex],
    });
  } catch (error) {
    console.error("Error updating room activity:", error);
    return c.json({ error: "更新房間活動時間失敗" }, 500);
  }
});

// 新增：更新房間參與人數的 API
app.patch("/api/rooms/:roomId/participants", async (c) => {
  try {
    const roomId = c.req.param("roomId");
    const body = await c.req.json();
    const { count } = body;

    if (typeof count !== "number" || count < 0) {
      return c.json({ error: "參與人數必須是非負整數" }, 400);
    }

    const roomIndex = rooms.findIndex((room) => room.id === roomId);

    if (roomIndex === -1) {
      return c.json({ error: "房間不存在" }, 404);
    }

    // 更新參與人數和最後活動時間
    rooms[roomIndex].participantCount = count;
    rooms[roomIndex].lastActivity = new Date().toISOString();

    return c.json({
      success: true,
      room: rooms[roomIndex],
    });
  } catch (error) {
    console.error("Error updating room participants:", error);
    return c.json({ error: "更新參與人數失敗" }, 500);
  }
});

export default app;
