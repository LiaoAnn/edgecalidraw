import { Hono } from "hono";
import auth from "./routes/auth";
import room from "./routes/room";
import uploads from "./routes/uploads";
import { env } from "cloudflare:workers";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// external routes
app.route("/api/auth", auth);
app.route("/api/rooms", room);
app.route("/api/uploads", uploads);

app.get("/api/connect/:roomId", async (c) => {
  const id = env.TLDRAW_DURABLE_OBJECT.idFromName(c.req.param("roomId"));
  const room = env.TLDRAW_DURABLE_OBJECT.get(id);
  return room.fetch(c.req.raw);
});

export { TldrawDurableObject } from "./TldrawDurableObject";

export default app;
