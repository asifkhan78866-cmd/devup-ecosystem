/**
 * Single source of truth for how "complete" a profile is.
 *
 * Shared by the profile endpoint (to show the meter) and the apply endpoint
 * (to gate submissions), so the number a student sees is exactly the number
 * they are judged against.
 */

/** Must be present before an application can be submitted at all. */
export const REQUIRED_TO_APPLY: Array<[string, string]> = [
  ["name", "Full name"],
  ["phone", "Phone number"],
  ["college", "College"],
  ["skills", "Skills"],
  ["resumeUrl", "Resume"],
];

/** Everything that counts toward the percentage. */
const SCORED: Array<[string, string]> = [
  ["name", "Full name"],
  ["phone", "Phone number"],
  ["college", "College"],
  ["skills", "Skills"],
  ["resumeUrl", "Resume"],
  ["bio", "Short bio"],
  ["city", "City"],
  ["degree", "Degree"],
  ["branch", "Branch"],
  ["graduationYear", "Graduation year"],
  ["cgpa", "CGPA"],
  ["githubUrl", "GitHub"],
  ["linkedinUrl", "LinkedIn"],
  ["portfolioUrl", "Portfolio"],
];

export const MIN_COMPLETENESS_TO_APPLY = 50;

const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "");

export function completeness(profile: Record<string, unknown> | null): number {
  if (!profile) return 0;
  const have = SCORED.filter(([key]) => filled(profile[key])).length;
  return Math.round((have / SCORED.length) * 100);
}

/** Hard requirements the student is still missing. */
export function missingRequired(profile: Record<string, unknown> | null): string[] {
  if (!profile) return REQUIRED_TO_APPLY.map(([, label]) => label);
  return REQUIRED_TO_APPLY.filter(([key]) => !filled(profile[key])).map(([, label]) => label);
}

/** Optional fields that would raise the score — used to nudge the student. */
export function suggestions(profile: Record<string, unknown> | null): string[] {
  if (!profile) return SCORED.map(([, label]) => label);
  return SCORED.filter(([key]) => !filled(profile[key])).map(([, label]) => label);
}

export interface ApplyEligibility {
  eligible: boolean;
  completeness: number;
  missing: string[];
  reason?: string;
}

export function canApply(profile: Record<string, unknown> | null): ApplyEligibility {
  const score = completeness(profile);
  const missing = missingRequired(profile);

  if (missing.length > 0) {
    return {
      eligible: false,
      completeness: score,
      missing,
      reason: `Add ${missing.join(", ")} to your profile before applying.`,
    };
  }

  if (score < MIN_COMPLETENESS_TO_APPLY) {
    return {
      eligible: false,
      completeness: score,
      missing: suggestions(profile),
      reason: `Your profile is ${score}% complete. Startups need at least ${MIN_COMPLETENESS_TO_APPLY}% before you can apply.`,
    };
  }

  return { eligible: true, completeness: score, missing: [] };
}
