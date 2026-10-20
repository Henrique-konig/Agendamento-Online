/**
 * Gerador de BR Code estático (Pix "copia e cola"), conforme o Manual de
 * Padrões para Iniciação do Pix do Banco Central (EMV® QRCPS-MPM).
 */

function field(id: string, value: string) {
  const length = String(value.length).padStart(2, "0");
  if (value.length > 99) throw new Error(`Campo ${id} excede 99 caracteres`);
  return `${id}${length}${value}`;
}

/** CRC-16/CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF). */
export function crc16(payload: string) {
  let crc = 0xffff;
  for (const byte of Buffer.from(payload, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres fora do conjunto aceito pelos bancos. */
export function sanitize(text: string, max: number) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .,\-/]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

export type StaticPixInput = {
  key: string;
  merchantName: string;
  merchantCity: string;
  amountCents?: number;
  /** Identificador da transação (até 25 caracteres alfanuméricos). */
  txid?: string;
  description?: string;
};

export function buildStaticPix(input: StaticPixInput) {
  const txid = (input.txid ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const description = input.description ? sanitize(input.description, 40) : "";

  const merchantAccount =
    field("00", "br.gov.bcb.pix") +
    field("01", input.key.trim()) +
    (description ? field("02", description) : "");

  const payload =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    (input.amountCents ? field("54", (input.amountCents / 100).toFixed(2)) : "") +
    field("58", "BR") +
    field("59", sanitize(input.merchantName, 25) || "RECEBEDOR") +
    field("60", sanitize(input.merchantCity, 15) || "BRASIL") +
    field("62", field("05", txid)) +
    "6304";

  return payload + crc16(payload);
}
