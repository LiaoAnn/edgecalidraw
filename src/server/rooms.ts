import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { room } from "../db/schema";

// 輔助函數：從標題中提取英文部分並生成房間 ID
function generateRoomId(title: string): string {
	let englishTitle = title.toLowerCase().trim();
	englishTitle = englishTitle.replace(/[^a-z0-9\-_\s]/g, "");
	englishTitle = englishTitle.replace(/\s+/g, "-");
	englishTitle = englishTitle.replace(/-+/g, "-").replace(/^-|-$/g, "");
	if (!englishTitle) {
		englishTitle = "room";
	}
	const uid = Math.random().toString(36).substring(2, 8);
	return `${englishTitle}-${uid}`;
}

export const getRooms = createServerFn({ method: "GET" }).handler(async () => {
	const db = drizzle(env.DB);
	const allRooms = await db
		.select()
		.from(room)
		.orderBy(desc(room.lastActivity));

	return allRooms.map((r) => ({
		id: r.id,
		name: r.name,
		createdAt: new Date(r.createdAt * 1000).toISOString(),
		lastActivity: new Date(r.lastActivity * 1000).toISOString(),
	}));
});

export const createRoom = createServerFn({ method: "POST" })
	.inputValidator((title: string) => title)
	.handler(async ({ data: title }) => {
		if (!title || typeof title !== "string" || title.trim().length === 0) {
			throw new Error("標題是必填欄位");
		}

		const roomId = generateRoomId(title);
		const now = Math.floor(Date.now() / 1000);

		const db = drizzle(env.DB);

		const [insertedRoom] = await db
			.insert(room)
			.values({
				id: roomId,
				name: title.trim(),
				lastActivity: now,
			})
			.returning();

		return {
			id: insertedRoom.id,
			name: insertedRoom.name,
			createdAt: new Date(insertedRoom.createdAt * 1000).toISOString(),
			lastActivity: new Date(insertedRoom.lastActivity * 1000).toISOString(),
		};
	});

export const deleteRoom = createServerFn({ method: "POST" })
	.inputValidator((roomId: string) => roomId)
	.handler(async ({ data: roomId }) => {
		const db = drizzle(env.DB);
		await db.delete(room).where(eq(room.id, roomId));
		return { success: true };
	});

export const checkRoomExists = createServerFn({ method: "GET" })
	.inputValidator((roomId: string) => roomId)
	.handler(async ({ data: roomId }) => {
		const db = drizzle(env.DB);
		const existingRoom = await db
			.select()
			.from(room)
			.where(eq(room.id, roomId))
			.limit(1);

		const exists = existingRoom.length > 0;

		return {
			exists,
			room: exists
				? {
						id: existingRoom[0].id,
						name: existingRoom[0].name,
						createdAt: new Date(existingRoom[0].createdAt * 1000).toISOString(),
						lastActivity: new Date(
							existingRoom[0].lastActivity * 1000,
						).toISOString(),
					}
				: null,
		};
	});

export const updateRoomActivity = createServerFn({ method: "POST" })
	.inputValidator((roomId: string) => roomId)
	.handler(async ({ data: roomId }) => {
		const now = Math.floor(Date.now() / 1000);
		const db = drizzle(env.DB);

		const [updatedRoom] = await db
			.update(room)
			.set({ lastActivity: now })
			.where(eq(room.id, roomId))
			.returning();

		if (!updatedRoom) {
			throw new Error("房間不存在");
		}

		return {
			id: updatedRoom.id,
			name: updatedRoom.name,
			createdAt: new Date(updatedRoom.createdAt * 1000).toISOString(),
			lastActivity: new Date(updatedRoom.lastActivity * 1000).toISOString(),
		};
	});
