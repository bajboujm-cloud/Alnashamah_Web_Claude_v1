import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/server/env";
import { detectImage, MAX_UPLOAD_BYTES, type ImageKind } from "./validate";

/**
 * File storage for photos and illustrations. Local disk on the laptop (./.storage, served at /files/…);
 * a Vercel Blob implementation is added at go-live behind the same functions.
 */
const root = path.resolve(env.STORAGE_DIR);

export type UploadResult = { ok: true; url: string } | { ok: false; error: "tooBig" | "badType" };

export async function saveImage(file: File, folder: string, allowSvg = false): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "tooBig" };
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind: ImageKind | null = detectImage(bytes, allowSvg);
  if (!kind) return { ok: false, error: "badType" };
  const safeFolder = folder.replace(/[^a-z0-9-]/g, "");
  const key = `${safeFolder}/${randomUUID()}.${kind}`;
  await mkdir(path.join(root, safeFolder), { recursive: true });
  await writeFile(path.join(root, key), bytes);
  return { ok: true, url: `/files/${key}` };
}

/** Deletes a file we stored earlier; ignores built-in images under /public and unknown paths. */
export async function deleteStoredFile(url: string | null | undefined) {
  if (!url?.startsWith("/files/")) return;
  const full = resolveKey(url.slice("/files/".length));
  if (full) await unlink(full).catch(() => {});
}

/** Maps a key to a path inside the storage folder, refusing anything that escapes it. */
export function resolveKey(key: string) {
  if (!/^[a-z0-9-]+\/[0-9a-f-]{36}\.(jpg|png|webp|svg)$/.test(key)) return null;
  const full = path.join(root, key);
  return full.startsWith(root + path.sep) ? full : null;
}

export async function readStoredFile(key: string) {
  const full = resolveKey(key);
  if (!full) return null;
  return readFile(full).catch(() => null);
}
