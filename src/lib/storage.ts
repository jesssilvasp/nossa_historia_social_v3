import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

const EXT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
};

export function contentTypeFor(name: string): string {
  return EXT_TYPES[path.extname(name).toLowerCase()] ?? "application/octet-stream";
}

export function kindFor(name: string): "image" | "video" | "audio" {
  const type = contentTypeFor(name);
  if (type.startsWith("video")) return "video";
  if (type.startsWith("audio")) return "audio";
  return "image";
}

export async function saveUpload(file: File): Promise<{ url: string; name: string; kind: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60) || "arquivo";
  const name = `${randomUUID()}-${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return { url: `/api/files/${name}`, name, kind: kindFor(name) };
}

export async function readUpload(name: string): Promise<Buffer | null> {
  const safe = path.basename(name);
  try {
    return await readFile(path.join(UPLOAD_DIR, safe));
  } catch {
    return null;
  }
}
