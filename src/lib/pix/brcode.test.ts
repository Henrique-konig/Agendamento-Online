import { describe, expect, it } from "vitest";
import { buildStaticPix, crc16, sanitize } from "./brcode";

/** Decodifica TLV de primeiro nível para inspeção. */
function parse(payload: string) {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    fields[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return fields;
}

describe("crc16", () => {
  it("bate com o valor de verificação do CRC-16/CCITT-FALSE", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("buildStaticPix", () => {
  const code = buildStaticPix({
    key: "contato@barbeariadoze.com.br",
    merchantName: "Barbearia do Zé Ltda Muito Longo",
    merchantCity: "Porto Alegre",
    amountCents: 4550,
    txid: "AG-1234abcd",
  });
  const fields = parse(code);

  it("monta os campos obrigatórios", () => {
    expect(fields["00"]).toBe("01");
    expect(fields["52"]).toBe("0000");
    expect(fields["53"]).toBe("986");
    expect(fields["54"]).toBe("45.50");
    expect(fields["58"]).toBe("BR");
    expect(fields["26"]).toContain("br.gov.bcb.pix");
    expect(fields["26"]).toContain("contato@barbeariadoze.com.br");
  });

  it("limita e higieniza nome, cidade e txid", () => {
    expect(fields["59"]).toBe("Barbearia do Ze Ltda Muit");
    expect(fields["60"]).toBe("Porto Alegre");
    expect(fields["62"]).toBe("0510AG1234abcd");
  });

  it("termina com CRC válido do próprio payload", () => {
    const body = code.slice(0, -4);
    expect(body.endsWith("6304")).toBe(true);
    expect(code.slice(-4)).toBe(crc16(body));
  });

  it("usa *** quando não há txid e omite valor quando não informado", () => {
    const f = parse(
      buildStaticPix({ key: "+5551999998888", merchantName: "Ana", merchantCity: "POA" }),
    );
    expect(f["62"]).toBe("0503***");
    expect(f["54"]).toBeUndefined();
  });
});

describe("sanitize", () => {
  it("remove acentos e símbolos", () => {
    expect(sanitize("São João & Cia!", 25)).toBe("Sao Joao Cia");
  });
});
