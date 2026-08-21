import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/\.\.(\/|\\)/g, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const uploadRoot = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "data", "uploads");
  const filePath = path.join(uploadRoot, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
  const publicBaseUrl = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
  return { key, url: `${publicBaseUrl}/uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const publicBaseUrl = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
  return { key, url: `${publicBaseUrl}/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  return (await storageGet(relKey)).url;
}
