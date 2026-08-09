import { getWorkerEnv } from "../../../../lib/cloudflare-runtime";

type ImageObject = {
  body: ReadableStream;
  httpEtag?: string;
  httpMetadata?: { contentType?: string };
};

type ImageBucket = {
  get: (key: string) => Promise<ImageObject | null>;
};

type RouteContext = { params: Promise<{ key: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { key } = await context.params;
  const env = await getWorkerEnv();
  const bucket = (env as unknown as { BUCKET?: ImageBucket }).BUCKET;
  if (!bucket) return new Response("Storage unavailable", { status: 503 });

  const object = await bucket.get(decodeURIComponent(key));
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  return new Response(object.body, { headers });
}
