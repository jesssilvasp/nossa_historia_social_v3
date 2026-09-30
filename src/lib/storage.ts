import { uploadToAppwrite, deleteFromAppwrite, getAppwriteFileUrl, kindFor } from "./appwrite";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/tmp/uploads";

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
  return EXT_TYPES[name.slice(name.lastIndexOf(".")).toLowerCase()] ?? "application/octet-stream";
}

export async function saveUpload(file: File, folder: "avatars" | "covers" | "posts" | "albums" = "posts"): Promise<{ url: string; name: string; kind: string }> {
  const result = await uploadToAppwrite(file, folder);
  return { url: result.url, name: result.fileId, kind: result.kind };
}

export async function readUpload(name: string): Promise<Buffer | null> {
  return null;
}

export async function removeUploadUrl(url: string): Promise<void> {
  if (url.includes("/storage/buckets/")) {
    const fileId = url.split("/files/")[1]?.split("/")[0];
    if (fileId) await deleteFromAppwrite(fileId);
  }
}

export { getAppwriteFileUrl, kindFor };