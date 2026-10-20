import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function parseKey(base64Key: string) {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) throw new Error("A chave de criptografia precisa ter 32 bytes (base64).");
  return key;
}

/** Criptografa com AES-256-GCM. Formato: v1.<iv>.<tag>.<dados> (base64url). */
export function encrypt(plaintext: string, base64Key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, parseKey(base64Key), iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, data]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
}

export function decrypt(payload: string, base64Key: string) {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== VERSION || !iv || !tag || data === undefined) {
    throw new Error("Formato de dado criptografado inválido.");
  }
  const decipher = createDecipheriv(ALGORITHM, parseKey(base64Key), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
