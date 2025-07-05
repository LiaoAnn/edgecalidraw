import { DurableObject } from "cloudflare:workers";

export interface Room {
  id: string;
  name: string;
  createdAt: string;
  lastActivity: string;
  participantCount: number;
}

export class RoomManager extends DurableObject<Cloudflare> {
  constructor(ctx: DurableObjectState, env: Cloudflare) {
    super(ctx, env);
  }

  async getRooms(): Promise<Room[]> {
    const rooms = (await this.ctx.storage.get<Room[]>("rooms")) || [];
    return rooms;
  }

  async createRoom(room: Room): Promise<void> {
    const rooms = await this.getRooms();
    rooms.push(room);
    await this.ctx.storage.put("rooms", rooms);
  }

  async updateRoomActivity(roomId: string): Promise<void> {
    const rooms = await this.getRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId);

    if (roomIndex !== -1) {
      rooms[roomIndex].lastActivity = new Date().toISOString();
      await this.ctx.storage.put("rooms", rooms);
    }
  }

  async updateParticipantCount(roomId: string, count: number): Promise<void> {
    const rooms = await this.getRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId);

    if (roomIndex !== -1) {
      rooms[roomIndex].participantCount = count;
      rooms[roomIndex].lastActivity = new Date().toISOString();
      await this.ctx.storage.put("rooms", rooms);
    }
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    const rooms = await this.getRooms();
    const initialLength = rooms.length;
    const filteredRooms = rooms.filter((r) => r.id !== roomId);

    if (filteredRooms.length !== initialLength) {
      await this.ctx.storage.put("rooms", filteredRooms);
      return true;
    }

    return false;
  }
}
