import { Hono } from "hono";
import room from "./routes/room";
import auth from "./routes/auth";

const app = new Hono<{ Bindings: CloudflareBindings }>();

// external routes
app.route("/api/rooms", room);
app.route("/api/auth", auth);

export default app;
