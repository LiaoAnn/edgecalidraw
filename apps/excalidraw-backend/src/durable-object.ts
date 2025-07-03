import { DurableObject } from "cloudflare:workers";
import {
  BufferEvent,
  ExcalidrawElementChangeSchema,
  UserJoinEventSchema,
  UserLeaveEventSchema,
} from "@workspace/schemas/events";

export class ExcalidrawWebSocketServer extends DurableObject<Cloudflare> {
  elements: any[] = [];
  activeUsers: Set<string> = new Set();
  userSessions: Map<string, WebSocket> = new Map();

  constructor(ctx: DurableObjectState, env: Cloudflare) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.elements = (await ctx.storage.get("elements")) || [];
    });
  }

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const client = webSocketPair[1];
    const server = webSocketPair[0];
    this.ctx.acceptWebSocket(server);
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer
  ): Promise<void> {
    if (message === "setup") {
      ws.send(
        JSON.stringify(
          ExcalidrawElementChangeSchema.parse({
            type: "elementChange",
            data: this.elements,
          })
        )
      );
      return;
    }

    this.handleMessage(ws, message);
  }

  webSocketClose(ws: WebSocket) {
    console.log("WebSocket closed");

    // Find and remove the user associated with this WebSocket
    const userId = this.findUserIdBySocket(ws);
    if (userId) {
      this.activeUsers.delete(userId);
      this.userSessions.delete(userId);

      // Broadcast user leave event to other clients
      this.broadcastUserLeaveEvent(userId);
    }
  }

  webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {
    console.error("WebSocket error:", error);
    // Handle the same as close
    this.webSocketClose(ws);
  }

  private findUserIdBySocket(ws: WebSocket): string | null {
    for (const [userId, socket] of this.userSessions.entries()) {
      if (socket === ws) {
        return userId;
      }
    }
    return null;
  }

  private broadcastUserLeaveEvent(userId: string) {
    const leaveEvent = JSON.stringify(
      UserLeaveEventSchema.parse({
        type: "userLeave",
        data: { userId },
      })
    );

    // Broadcast to all connected clients
    for (const session of this.ctx.getWebSockets()) {
      try {
        session.send(leaveEvent);
      } catch (error) {
        console.error("Error sending leave event:", error);
      }
    }
  }

  handleMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message === "string") {
      const event = BufferEvent.parse(JSON.parse(message));

      if (event.type === "pointer") {
        const userId = event.data.userId;

        // Track user session if not already tracked
        if (!this.activeUsers.has(userId)) {
          this.activeUsers.add(userId);
          this.userSessions.set(userId, ws);

          // Broadcast user join event to other clients
          this.broadcastUserJoinEvent(userId);
        } else {
          // Update the WebSocket reference in case it changed
          this.userSessions.set(userId, ws);
        }
      }
    }

    // Broadcast the original message to all other clients
    this.broadcastMsg(ws, message);
  }

  private broadcastUserJoinEvent(userId: string) {
    const joinEvent = JSON.stringify(
      UserJoinEventSchema.parse({
        type: "userJoin",
        data: { userId },
      })
    );

    // Broadcast to all connected clients except the sender
    for (const session of this.ctx.getWebSockets()) {
      if (this.userSessions.get(userId) !== session) {
        try {
          session.send(joinEvent);
        } catch (error) {
          console.error("Error sending join event:", error);
        }
      }
    }
  }

  broadcastMsg(ws: WebSocket, message: string | ArrayBuffer) {
    for (const session of this.ctx.getWebSockets()) {
      if (session !== ws) {
        session.send(message);
      }
    }
    if (typeof message === "string") {
      const event = BufferEvent.parse(JSON.parse(message));
      if (event.type === "elementChange") {
        this.elements = event.data;
        this.ctx.storage.put("elements", this.elements);
      }
    }
  }

  async getElements() {
    return {
      data: this.elements,
    };
  }
}
