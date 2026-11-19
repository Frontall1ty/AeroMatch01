import { describe, expect, it } from "vitest";
import { cleanQuery, csvCell, dayBuckets, pickFilter, toCsv } from "./adminUtils";

describe("csv", () => {
  it("quotes commas, quotes and line breaks", () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("x\ny")).toBe('"x\ny"');
  });
  it("defuses text a spreadsheet would run as a formula", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
  it("leaves numbers, booleans and empty values alone", () => {
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(null)).toBe("");
  });
  it("writes dates as ISO text and rows with CRLF", () => {
    expect(csvCell(new Date("2026-11-19T10:00:00Z"))).toBe("2026-11-19T10:00:00.000Z");
    expect(toCsv([["a", 1], ["b", 2]])).toBe("a,1\r\nb,2\r\n");
  });
});

describe("dayBuckets", () => {
  const now = new Date("2026-11-19T15:00:00Z");
  it("returns the last N days, oldest first, and counts each date", () => {
    const b = dayBuckets([new Date("2026-11-19T01:00:00Z"), new Date("2026-11-19T20:00:00Z"), new Date("2026-11-17T09:00:00Z"), new Date("2026-10-01T00:00:00Z")], 3, now);
    expect(b.map((x) => x.day)).toEqual(["2026-11-17", "2026-11-18", "2026-11-19"]);
    expect(b.map((x) => x.count)).toEqual([1, 0, 2]);
  });
});

describe("query helpers", () => {
  it("cleans a search value", () => {
    expect(cleanQuery("  hello\u0000world ")).toBe("hello world");
    expect(cleanQuery(undefined)).toBe("");
    expect(cleanQuery("x".repeat(200)).length).toBe(80);
  });
  it("only accepts a known filter", () => {
    expect(pickFilter("verified", ["all", "verified"] as const)).toBe("verified");
    expect(pickFilter("nope", ["all", "verified"] as const)).toBe("all");
    expect(pickFilter(undefined, ["all", "verified"] as const)).toBe("all");
  });
});
