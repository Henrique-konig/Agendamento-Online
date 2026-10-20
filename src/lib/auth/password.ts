import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Hash fixo usado para gastar o mesmo tempo quando o e-mail não existe (evita enumeração). */
export const DUMMY_HASH = bcrypt.hashSync("senha-inexistente-para-tempo-constante", COST);
