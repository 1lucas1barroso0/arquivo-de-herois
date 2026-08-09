import { getWorkerEnv } from "../../../lib/cloudflare-runtime";
import { apiError, getOwnerId } from "../../../lib/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type ImageBucket = {
  put: (
    key: string,
    value: ArrayBuffer,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ) => Promise<unknown>;
};

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      return Response.json(
        { error: "Use uma imagem PNG, JPG, WEBP ou GIF." },
        { status: 415 },
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return Response.json(
        { error: "A imagem deve ter no máximo 5 MB." },
        { status: 413 },
      );
    }

    const env = await getWorkerEnv();
    const bucket = (env as unknown as { BUCKET?: ImageBucket }).BUCKET;
    if (!bucket) throw new Error("O armazenamento de imagens está indisponível.");

    const ownerId = await getOwnerId(request);
    const extension = extensionFor(file.type);
    const key = `portraits/${ownerId}/${randomId()}.${extension}`;
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        originalName: file.name.slice(0, 180),
        uploadedAt: new Date().toISOString(),
      },
    });

    return Response.json(
      { key, url: `/api/uploads/${encodeURIComponent(key)}` },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error, "Não foi possível enviar a imagem.");
  }
}

function extensionFor(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "png";
}

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
