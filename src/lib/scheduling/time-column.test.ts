import { describe, expect, it } from "vitest";
import { timeColumnToString } from "./time";

describe("timeColumnToString", () => {
  it("formata colunas TIME como HH:MM", () => {
    expect(timeColumnToString(new Date("1970-01-01T09:30:00.000Z"))).toBe("09:30");
    expect(timeColumnToString(new Date("1970-01-01T18:00:00.000Z"))).toBe("18:00");
  });
});
