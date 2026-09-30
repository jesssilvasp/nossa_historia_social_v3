import { Client, Storage, Account, Users, Databases, ID } from "node-appwrite";

function getServerClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
  return {
    storage: new Storage(client),
    account: new Account(client),
    users: new Users(client),
    databases: new Databases(client),
  };
}

function getClientClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
  return {
    storage: new Storage(client),
    account: new Account(client),
  };
}

export const BUCKET_ID = "uploads";

export async function uploadToAppwrite(
  file: File,
  folder: "avatars" | "covers" | "posts" | "albums" = "posts"
): Promise<{ url: string; fileId: string; kind: string }> {
  const { storage } = getServerClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${folder}/${ID.unique()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;

  const result = await storage.createFile(BUCKET_ID, ID.unique(), new File([buffer], fileName, { type: file.type }));

  const url = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${result.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

  return {
    url,
    fileId: result.$id,
    kind: file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image",
  };
}

export async function deleteFromAppwrite(fileId: string): Promise<void> {
  const { storage } = getServerClient();
  await storage.deleteFile(BUCKET_ID, fileId);
}

export function getAppwriteFileUrl(fileId: string): string {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}

export function kindFor(name: string): "image" | "video" | "audio" {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  if ([".mp4", ".webm", ".mov", ".mkv"].includes(ext)) return "video";
  if ([".mp3", ".wav", ".ogg", ".m4a", ".flac"].includes(ext)) return "audio";
  return "image";
}

export { getServerClient, getClientClient, ID };