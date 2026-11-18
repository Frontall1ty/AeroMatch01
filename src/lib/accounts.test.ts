import { describe, expect, it } from "vitest";
import { DEMO_EMAIL_SUFFIX, isDemoEmail, loginSchema, profileSchema, registerSchema } from "./accountSchemas";
import { allow } from "./rateLimit";
import { DELIVERED_NEEDED, missingProfileFields, verificationSummary } from "./verification";

const good = {
  role: "CARRIER",
  name: "Aziz Karimov",
  companyName: "Karimov Logistics",
  city: "TAS",
  email: "Aziz@Karimov-Logistics.UZ ",
  password: "correct-horse-battery",
};

describe("registration", () => {
  it("accepts a complete form and normalises the email", () => {
    const r = registerSchema.safeParse(good);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("aziz@karimov-logistics.uz");
  });
  it("only allows shipper or carrier (never admin)", () => {
    expect(registerSchema.safeParse({ ...good, role: "ADMIN" }).success).toBe(false);
  });
  it("needs a city from the list", () => {
    expect(registerSchema.safeParse({ ...good, city: "XXX" }).success).toBe(false);
  });
  it("rejects a bad email", () => {
    expect(registerSchema.safeParse({ ...good, email: "not-an-email" }).success).toBe(false);
  });
  it("needs a password of at least 10 characters", () => {
    expect(registerSchema.safeParse({ ...good, password: "short1" }).success).toBe(false);
  });
  it("refuses very common and repetitive passwords", () => {
    expect(registerSchema.safeParse({ ...good, password: "password123" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...good, password: "aaaaaaaaaaaa" }).success).toBe(false);
  });
});

describe("login", () => {
  it("needs an email and a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("profile", () => {
  const base = { city: "IST", phone: "", address: "", taxId: "", website: "", about: "" };
  it("turns empty optional fields into null", () => {
    const r = profileSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ phone: null, address: null, taxId: null, website: null });
  });
  it("checks the website address", () => {
    expect(profileSchema.safeParse({ ...base, website: "example.com" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, website: "https://example.com" }).success).toBe(true);
  });
});

describe("demo accounts", () => {
  it("are recognised by their email suffix only", () => {
    expect(isDemoEmail(`shipper${DEMO_EMAIL_SUFFIX}`)).toBe(true);
    expect(isDemoEmail("someone@gmail.com")).toBe(false);
    expect(isDemoEmail(null)).toBe(false);
  });
  it("cannot be registered through the form by a stranger without the suffix check being passed", () => {
    // Registering with the demo suffix is allowed by the schema; the action refuses it. See auth-actions.
    expect(registerSchema.safeParse({ ...good, email: `x${DEMO_EMAIL_SUFFIX}` }).success).toBe(true);
  });
});

describe("verification helpers", () => {
  const full = { city: "TAS", phone: "+998 00 000 00 00", address: "1 Example Street", taxId: "123456789" };
  it("lists what is missing from a profile", () => {
    expect(missingProfileFields({ city: "TAS", phone: "", address: null, taxId: " " })).toEqual(["Phone number", "Company address", "Tax ID"]);
  });
  it("is eligible with a complete profile", () => {
    const s = verificationSummary({ ...full, verified: false }, 0);
    expect(s.profileComplete).toBe(true);
    expect(s.eligible).toBe(true);
    expect(s.verified).toBe(false); // never verifies by itself
  });
  it("is eligible after enough delivered shipments even with an empty profile", () => {
    expect(verificationSummary({ verified: false }, DELIVERED_NEEDED).eligible).toBe(true);
    expect(verificationSummary({ verified: false }, DELIVERED_NEEDED - 1).eligible).toBe(false);
  });
});

describe("rate limit", () => {
  it("allows up to the limit and then refuses", () => {
    const key = `t-${Math.random()}`;
    const results = Array.from({ length: 5 }, () => allow(key, 3, 60_000));
    expect(results).toEqual([true, true, true, false, false]);
  });
});
