import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";

/** 32-byte key derived from AUTH_SECRET for a given purpose. */
function key(secret: string, purpose: string) {
  return Buffer.from(hkdfSync("sha256", secret, "al-nashamah", purpose, 32));
}

/** AES-256-GCM encryption; output is "iv.tag.ciphertext" in base64url. */
const TAG_BYTES = 16;

export function encrypt(plain: string, secret: string, purpose = "totp") {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret, purpose), iv, { authTagLength: TAG_BYTES });
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload: string, secret: string, purpose = "totp") {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p ?? "", "base64url"));
  // Insist on the full 16-byte tag so a shortened (forged) tag can never pass.
  if (iv.length !== 12 || tag.length !== TAG_BYTES) throw new Error("Invalid encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", key(secret, purpose), iv, { authTagLength: TAG_BYTES });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
