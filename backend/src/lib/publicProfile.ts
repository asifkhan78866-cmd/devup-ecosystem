/**
 * The parts of a person that anyone may see.
 *
 * Name, short bio, where they study or live, and the links they chose to
 * publish. Never contact details or anything from an application: no email,
 * phone, CGPA, degree, graduation year, resume, platform role or sign-in data.
 * Every response that shows a person to someone other than themselves, their
 * hiring startup, or DevUp staff selects through this.
 */
export const PUBLIC_PROFILE_SELECT = {
  name: true,
  bio: true,
  college: true,
  city: true,
  linkedinUrl: true,
  githubUrl: true,
  twitterUrl: true,
  portfolioUrl: true,
  skills: true,
  isOpenToWork: true,
  isLookingForCofounder: true,
} as const;

export const PUBLIC_USER_SELECT = {
  id: true,
  avatarUrl: true,
  profile: { select: PUBLIC_PROFILE_SELECT },
} as const;

/** Columns no API response should ever carry, even to the account's owner. */
export const NEVER_RETURNED = { passwordHash: true } as const;
