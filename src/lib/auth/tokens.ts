import { createHash, randomBytes } from "node:crypto";

/** Token aleatório de 256 bits, seguro para URL e cookie. */
export function generateToken() {
  return randomBytes(32).toString("base64url");
}

/** No banco guardamos só o hash: vazar a tabela não revela tokens utilizáveis. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
