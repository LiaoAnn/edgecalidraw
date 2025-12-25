import handler from "@tanstack/react-start/server-entry";

export default {
  async fetch(request: Request, env: CloudflareBindings) {
    const url = new URL(request.url);

    // Handle asset uploads and downloads
    if (url.pathname.startsWith("/api/uploads/")) {
      const objectName = url.pathname.split("/").pop();
      if (!objectName) {
        return new Response("Object name missing", { status: 400 });
      }

      if (request.method === "POST" || request.method === "PUT") {
        await env.TLDRAW_BUCKET.put(`uploads/${objectName}`, request.body);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (request.method === "GET") {
        const object = await env.TLDRAW_BUCKET.get(`uploads/${objectName}`);
        if (!object) {
          return new Response("Object not found", { status: 404 });
        }
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        return new Response(object.body, { headers });
      }
    }

    if (url.pathname.startsWith("/api/connect/")) {
      const roomId = url.pathname.split("/").pop();
      if (roomId) {
        const id = env.TLDRAW_DURABLE_OBJECT.idFromName(roomId);
        const room = env.TLDRAW_DURABLE_OBJECT.get(id);
        return room.fetch(request);
      }
    }
    return handler.fetch(request);
  },
};

export { TldrawDurableObject } from "@/durable-object/TldrawDurableObject";
