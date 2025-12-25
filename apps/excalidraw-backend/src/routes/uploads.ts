import { Hono } from "hono";

// assets are stored in the bucket under the /uploads path
function getAssetObjectName(uploadId: string) {
  return `uploads/${uploadId.replace(/[^a-zA-Z0-9_-]+/g, "_")}`;
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/:uploadId", async (c) => {
  const objectName = getAssetObjectName(c.req.param("uploadId"));

  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
    return c.json({ error: "Invalid content type" }, 400);
  }

  if (await c.env.TLDRAW_BUCKET.head(objectName)) {
    return c.json({ error: "Upload already exists" }, 409);
  }

  await c.env.TLDRAW_BUCKET.put(objectName, await c.req.blob(), {
    httpMetadata: c.req.raw.headers,
  });

  return c.json({ ok: true });
});

app.get("/:uploadId", async (c) => {
  const objectName = getAssetObjectName(c.req.param("uploadId"));

  // if we have a cached response for this request (automatically handling ranges etc.), return it
  const cacheKey = new Request(c.req.url, { headers: c.req.raw.headers });
  const cachedResponse = await caches.default.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  // if not, we try to fetch the asset from the bucket
  const object = await c.env.TLDRAW_BUCKET.get(objectName, {
    range: c.req.raw.headers,
    onlyIf: c.req.raw.headers,
  });

  if (!object) {
    return c.json({ error: "Not found" }, 404);
  }

  // write the relevant metadata to the response headers
  const headers = new Headers();
  object.writeHttpMetadata(headers);

  // assets are immutable, so we can cache them basically forever:
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("etag", object.httpEtag);

  // we set CORS headers so all clients can access assets. we do this here so our `cors` helper in
  // worker.ts doesn't try to set extra cors headers on responses that have been read from the
  // cache, which isn't allowed by cloudflare.
  headers.set("access-control-allow-origin", "*");

  // cloudflare doesn't set the content-range header automatically in writeHttpMetadata, so we
  // need to do it ourselves.
  let contentRange;
  if (object.range) {
    if ("suffix" in object.range) {
      const start = object.size - object.range.suffix;
      const end = object.size - 1;
      contentRange = `bytes ${start}-${end}/${object.size}`;
    } else {
      const start = object.range.offset ?? 0;
      const end = object.range.length
        ? start + object.range.length - 1
        : object.size - 1;
      if (start !== 0 || end !== object.size - 1) {
        contentRange = `bytes ${start}-${end}/${object.size}`;
      }
    }
  }

  if (contentRange) {
    headers.set("content-range", contentRange);
  }

  const body = "body" in object && object.body ? object.body : null;
  const status = body ? (contentRange ? 206 : 200) : 304;

  // we only cache complete (200) responses
  if (status === 200) {
    const [cacheBody, responseBody] = body!.tee();
    c.executionCtx.waitUntil(
      caches.default.put(cacheKey, new Response(cacheBody, { headers, status }))
    );
    return new Response(responseBody, { headers, status });
  }

  return new Response(body, { headers, status });
});

export default app;
