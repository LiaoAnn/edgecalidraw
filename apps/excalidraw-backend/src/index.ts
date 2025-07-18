import { Hono } from "hono";
export { ExcalidrawWebSocketServer } from "./durable-object";
import { z } from "zod";
import room from "./routes/room";
import auth from "./routes/auth";
import library from "./routes/library";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// external routes
app.route("/api/rooms", room);
app.route("/api/auth", auth);
app.route("/api/library", library);

app.get("/api/get-elements/:drawingId", async (c) => {
  const ArraySchema = z.object({
    data: z.array(z.any()),
  });

  const drawingId = c.req.param("drawingId");
  const durableObjectId = c.env.DURABLE_OBJECT.idFromName(drawingId);
  const stub = c.env.DURABLE_OBJECT.get(durableObjectId);
  const elements = await stub.getElements();
  return c.json(ArraySchema.parse(elements));
});

app.get("/api/ws/:drawingId", (c) => {
  const drawingId = c.req.param("drawingId");
  const upgradeHeader = c.req.header("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return c.text("Expected websocket", 400);
  }

  const id = c.env.DURABLE_OBJECT.idFromName(drawingId);
  const stub = c.env.DURABLE_OBJECT.get(id);

  return stub.fetch(c.req.raw);
});

export default app;
