import { z } from "zod";
import { CITIES } from "./constants";

const cityCodes = CITIES.map((c) => c.code) as [string, ...string[]];

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(200, "That email is too long.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address, for example name@company.com.");

/** Length is what matters. Very common passwords are refused. */
const COMMON = new Set(["password12", "1234567890", "qwertyuiop", "password123", "1q2w3e4r5t", "iloveyou123"]);
export const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "Use at most 200 characters.")
  .refine((v) => !COMMON.has(v.toLowerCase()), "That password is too common. Choose another.")
  .refine((v) => new Set(v).size >= 4, "Use at least 4 different characters.");

export const registerSchema = z.object({
  role: z.enum(["SHIPPER", "CARRIER"], { error: "Choose shipper or carrier." }),
  name: z.string().trim().min(2, "Enter your name.").max(80, "Keep your name under 80 characters."),
  companyName: z.string().trim().min(2, "Enter your company name.").max(100, "Keep the company name under 100 characters."),
  city: z.enum(cityCodes, { error: "Choose your city." }),
  email,
  password,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(200),
});

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).transform((v) => (v === "" ? null : v));

export const profileSchema = z.object({
  city: z.enum(cityCodes, { error: "Choose your city." }),
  phone: optionalText(30, "Keep the phone number under 30 characters."),
  address: optionalText(200, "Keep the address under 200 characters."),
  taxId: optionalText(40, "Keep the tax ID under 40 characters."),
  website: optionalText(200, "Keep the website under 200 characters.").refine(
    (v) => v === null || /^https?:\/\/[^\s]+\.[^\s]+$/.test(v),
    "Start the website with http:// or https://.",
  ),
  about: optionalText(500, "Keep the description under 500 characters."),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/** Demo accounts have no password. They are entered from the demo page. */
export const DEMO_EMAIL_SUFFIX = "@demo.aeromatch.example";
export const isDemoEmail = (value: string | null | undefined) => !!value && value.endsWith(DEMO_EMAIL_SUFFIX);
