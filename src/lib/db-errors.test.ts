import { describe, expect, it } from "vitest";
import { isPgError, pgCode, PG } from "./db-errors";

const adapterError = (originalCode: string) => ({
  code: "P2039",
  meta: { driverAdapterError: { cause: { originalCode } } },
});

describe("pgCode", () => {
  it("lê o SQLSTATE do erro do adaptador", () => {
    expect(pgCode(adapterError("23P01"))).toBe("23P01");
    expect(isPgError(adapterError("23514"), PG.CHECK)).toBe(true);
  });

  it("reconhece violação de unicidade do Prisma", () => {
    expect(pgCode({ code: "P2002" })).toBe(PG.UNIQUE);
  });

  it("ignora erros que não são do banco", () => {
    expect(pgCode(new Error("x"))).toBeNull();
    expect(pgCode(null)).toBeNull();
  });
});
