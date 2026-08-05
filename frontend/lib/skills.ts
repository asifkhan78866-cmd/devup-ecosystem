/**
 * Turns a pasted blob of skills into a clean list.
 *
 * Commas, semicolons and newlines are explicit separators, so multi-word skills
 * survive verbatim. Plain space-separated input is ambiguous — "REST API" is one
 * skill but "HTML CSS" is two — so known multi-word technologies are lifted out
 * before the remainder is split on whitespace.
 */

/** Longest first, so "Google Cloud Platform" matches before "Google Cloud". */
const MULTI_WORD_SKILLS = [
  "Google Cloud Platform",
  "Amazon Web Services",
  "Natural Language Processing",
  "Object Oriented Programming",
  "Continuous Integration",
  "Machine Learning",
  "Deep Learning",
  "Computer Vision",
  "Data Structures",
  "Data Science",
  "Data Analysis",
  "Digital Marketing",
  "Project Management",
  "Mobile Development",
  "Web Development",
  "Problem Solving",
  "Public Speaking",
  "Content Writing",
  "Cloud Computing",
  "Microsoft Azure",
  "Version Control",
  "GitHub Actions",
  "Android Studio",
  "System Design",
  "Framer Motion",
  "Visual Studio",
  "After Effects",
  "Premiere Pro",
  "Tailwind CSS",
  "React Native",
  "Unit Testing",
  "GraphQL API",
  "Google Cloud",
  "Spring Boot",
  "Material UI",
  "REST APIs",
  "REST API",
  "Socket IO",
  "Power BI",
  "Adobe XD",
].sort((a, b) => b.length - a.length);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Sentinel for held-out phrases. Contains no whitespace, so splitting cannot break it. */
const HOLD = (i: number) => `@@SKILL${i}@@`;
const HOLD_RE = /^@@SKILL(\d+)@@$/;

export function parseSkills(raw: string): string[] {
  if (!raw || !raw.trim()) return [];

  // An explicit separator means the author already told us where the boundaries
  // are, so respect them exactly and do no phrase detection.
  if (/[,;\n\t]/.test(raw)) {
    return clean(raw.split(/[,;\n\t]+/));
  }

  // Whitespace-only input: protect known phrases first, split, then restore.
  let working = raw;
  const held: string[] = [];

  for (const phrase of MULTI_WORD_SKILLS) {
    const re = new RegExp(`(?<![\\w])${escapeRe(phrase)}(?![\\w])`, "gi");
    working = working.replace(re, (match) => {
      held.push(match);
      return ` ${HOLD(held.length - 1)} `;
    });
  }

  const tokens = working.split(/\s+/).map((t) => {
    const m = t.match(HOLD_RE);
    return m ? held[Number(m[1])] : t;
  });

  return clean(tokens);
}

function clean(parts: string[]): string[] {
  return dedupe(
    parts
      .map((s) => s.trim().replace(/^[•\-*]\s*/, "")) // tolerate pasted bullet lists
      .filter(Boolean)
      .map((s) => (s.length > 40 ? s.slice(0, 40) : s))
  );
}

/** Case-insensitive dedupe that keeps the first spelling seen. */
export function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Merge new skills into an existing list without duplicating. */
export function mergeSkills(existing: string[], incoming: string[], max = 50): string[] {
  return dedupe([...existing, ...incoming]).slice(0, max);
}
