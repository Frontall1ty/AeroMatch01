import { describe, expect, it } from "vitest";
import { normalizePasscode } from "./passcode";

describe("normalizePasscode", () => {
  it("removes spaces and line breaks around the value", () => {
    expect(normalizePasscode("  aero2026\n")).toBe("aero2026");
  });
  it("removes one pair of wrapping quotes", () => {
    expect(normalizePasscode('"aero2026"')).toBe("aero2026");
    expect(normalizePasscode("'aero2026'")).toBe("aero2026");
    expect(normalizePasscode(' "aero2026" \n')).toBe("aero2026");
  });
  it("keeps quotes inside the value and the case", () => {
    expect(normalizePasscode('Ae"ro')).toBe('Ae"ro');
    expect(normalizePasscode("AeRo")).not.toBe("aero");
  });
  it("drops invisible characters a paste can bring along", () => {
    expect(normalizePasscode("\u200Baero\u200D2026\uFEFF")).toBe("aero2026");
    expect(normalizePasscode("aero2026\u00A0")).toBe("aero2026");
  });
  it("treats a missing value as empty", () => {
    expect(normalizePasscode(undefined)).toBe("");
    expect(normalizePasscode(null)).toBe("");
  });
});
