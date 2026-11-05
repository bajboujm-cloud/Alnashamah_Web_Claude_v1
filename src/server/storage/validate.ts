export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type ImageKind = "jpg" | "png" | "webp" | "svg";

/** Detects the real file type from its first bytes (never trusts the file name or browser type). */
export function detectImage(bytes: Uint8Array, allowSvg: boolean): ImageKind | null {
  const b = bytes;
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (
    b.length > 12 &&
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP"
  )
    return "webp";
  if (allowSvg) {
    const head = new TextDecoder().decode(b.slice(0, 1024)).trimStart().toLowerCase();
    if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "svg";
  }
  return null;
}

export const contentTypes: Record<ImageKind, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
};
