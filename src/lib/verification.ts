/**
 * A carrier is shown to shippers only when it is verified. Verification is done by hand by the team.
 * These helpers show the team, and the carrier, what is missing. They never verify anyone by themselves.
 */
export const DELIVERED_NEEDED = 3;

export type ProfileFields = {
  city?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
};

const REQUIRED: { key: keyof ProfileFields; label: string }[] = [
  { key: "city", label: "City" },
  { key: "phone", label: "Phone number" },
  { key: "address", label: "Company address" },
  { key: "taxId", label: "Tax ID" },
];

export function missingProfileFields(company: ProfileFields): string[] {
  return REQUIRED.filter(({ key }) => !company[key] || String(company[key]).trim() === "").map((r) => r.label);
}

export type VerificationSummary = {
  verified: boolean;
  profileComplete: boolean;
  missing: string[];
  deliveredCount: number;
  deliveredNeeded: number;
  /** True when the team can reasonably verify: profile complete, or enough completed shipments. */
  eligible: boolean;
};

export function verificationSummary(
  company: ProfileFields & { verified: boolean },
  deliveredCount: number,
): VerificationSummary {
  const missing = missingProfileFields(company);
  const profileComplete = missing.length === 0;
  return {
    verified: company.verified,
    profileComplete,
    missing,
    deliveredCount,
    deliveredNeeded: DELIVERED_NEEDED,
    eligible: profileComplete || deliveredCount >= DELIVERED_NEEDED,
  };
}
