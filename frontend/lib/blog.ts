/**
 * Blog content model for DEVTHON / DevUp Ecosystem.
 *
 * Posts are authored as structured content blocks (no MDX runtime needed),
 * which keeps them server-rendered, fast, and fully crawlable. Each post
 * powers /blog/<slug> with BlogPosting (Article) JSON-LD.
 *
 * Add new posts by appending to BLOG_POSTS. The 100-title content backlog
 * lives in `content/blog-ideas.md`.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description + card summary (~150-160 chars) */
  description: string;
  category: string;
  /** ISO date */
  date: string;
  updated?: string;
  author: string;
  /** Estimated reading time in minutes */
  readingTime: number;
  keywords: string[];
  /** Lead paragraph shown under the H1 */
  lead: string;
  body: Block[];
}

export const BLOG_CATEGORIES = [
  "Hackathons",
  "Career",
  "AI & Machine Learning",
  "Coding",
  "Startups",
  "Student Development",
] as const;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-prepare-for-a-hackathon",
    title: "How to Prepare for a Hackathon: The Complete 2026 Guide for Beginners",
    description:
      "A step-by-step guide to preparing for your first hackathon in 2026 — from building a team and choosing tools to planning, pitching, and winning. Perfect for students and beginners.",
    category: "Hackathons",
    date: "2026-07-10",
    author: "DevUp Ecosystem",
    readingTime: 8,
    keywords: [
      "how to prepare for a hackathon",
      "hackathon guide for beginners",
      "first hackathon tips",
      "hackathon preparation",
      "student hackathon guide",
      "hackathon checklist",
    ],
    lead: "Your first hackathon can feel intimidating — 36 hours, a blank repo, and a ticking clock. But the teams that do well aren't the ones who code fastest; they're the ones who prepare best. Here's exactly how to get ready.",
    body: [
      { type: "h2", text: "1. Understand what a hackathon actually rewards" },
      { type: "p", text: "A hackathon is not a coding exam. Judges reward a clear problem, a working demo, and a compelling story far more than clever-but-invisible engineering. Before you write a line of code, be able to answer three questions: What problem are we solving? Who has this problem? Why is our solution better? If you can answer those crisply, you're already ahead of most teams." },
      { type: "h2", text: "2. Build the right team" },
      { type: "p", text: "The strongest hackathon teams have a mix of skills, not four people who all do the same thing. Aim for coverage across four roles: a builder who ships the core feature, a designer who makes it look and feel real, a data or AI person if your idea needs it, and a storyteller who can pitch. In a team of four, people can wear more than one hat — but make sure every critical role is owned by someone." },
      { type: "ul", items: [
        "Recruit early — the best teammates are gone by the week of the event.",
        "Agree on communication (a group chat) and a shared repo before day one.",
        "Talk about goals: are you here to win, to learn, or to network? Aligned goals prevent mid-event friction.",
      ]},
      { type: "h2", text: "3. Sharpen your tools before the clock starts" },
      { type: "p", text: "You don't want to spend the first three hours configuring your environment. Set up your accounts, boilerplate, and deployment pipeline in advance. Reusing a starter template is almost always allowed and is a smart move — check your event's rules, but pre-built scaffolding (auth, database, a component library) is fair game and saves precious time." },
      { type: "ul", items: [
        "A code starter you know well (Next.js, Flask, Firebase — whatever you're fastest in).",
        "A deployment target that's one command away (Vercel, Render, Netlify).",
        "AI copilots and APIs you plan to use, with keys already provisioned.",
        "A simple design kit or component library so the UI looks polished fast.",
      ]},
      { type: "h2", text: "4. Plan your 36 hours backwards from the demo" },
      { type: "p", text: "Decide what your final demo must show, then work backwards. A common rule: spend the first 20% of your time on scoping and design, the middle 60% building the single most important feature, and the final 20% on the demo, pitch, and rehearsal. Protect that final block ruthlessly — a great project with a rushed demo loses to a simpler project that's presented clearly." },
      { type: "quote", text: "Build one feature that works flawlessly, not five features that half-work. Depth beats breadth every time in a demo." },
      { type: "h2", text: "5. Prepare your pitch like it matters — because it does" },
      { type: "p", text: "Most teams under-invest in the pitch, which is exactly why a good one stands out. Structure it in under three minutes: the problem, a live demo of your solution, why it matters, and what's next. Rehearse it out loud at least twice. Have a backup — a recorded video or screenshots — in case the live demo fails." },
      { type: "h2", text: "6. Take care of yourself" },
      { type: "p", text: "Sleep is a competitive advantage. Teams that pull an all-nighter often ship worse code and pitch worse than teams that grabbed four hours of rest. Eat, hydrate, and take short breaks. Your brain solves problems faster when it isn't fried." },
      { type: "h2", text: "Ready to put this into practice?" },
      { type: "p", text: "DEVTHON 2026 is a national innovation hackathon built for exactly this journey — with 36 domains, mentors, and a path from your first project to internships, placements, and startup incubation. Register, form your team, and apply everything above." },
    ],
  },
  {
    slug: "how-to-win-a-hackathon",
    title: "How to Win a Hackathon: 12 Proven Strategies from Winning Teams",
    description:
      "Learn how to win a hackathon in 2026 with 12 practical strategies used by winning teams — idea selection, scoping, demos, pitching, and judge psychology. A must-read for students and developers.",
    category: "Hackathons",
    date: "2026-07-12",
    author: "DevUp Ecosystem",
    readingTime: 9,
    keywords: [
      "how to win a hackathon",
      "hackathon winning strategy",
      "hackathon tips",
      "win a coding competition",
      "hackathon pitch tips",
      "hackathon judging criteria",
    ],
    lead: "Winning a hackathon is a repeatable skill, not luck. The same patterns show up again and again on winning teams. Here are 12 of them.",
    body: [
      { type: "h2", text: "Pick a problem people actually feel" },
      { type: "p", text: "Winning projects solve a problem the judges instantly recognize. If you have to spend a minute convincing the room the problem is real, you've already lost momentum. Choose something relatable — students, small businesses, healthcare, sustainability — where the pain is obvious." },
      { type: "h2", text: "Scope brutally" },
      { type: "p", text: "The single biggest mistake teams make is building too much. Cut your idea down to the one feature that proves the concept, and make that feature genuinely work. A focused, working demo beats an ambitious, broken one." },
      { type: "h2", text: "Align with the judging criteria" },
      { type: "p", text: "Most hackathons publish their judging rubric — innovation, impact, technical execution, design, and viability. Read it, and deliberately earn points in each category. If 'impact' is weighted heavily, quantify your impact in the pitch." },
      { type: "ul", items: [
        "Map each rubric category to something concrete in your demo.",
        "If there are sponsor prizes, decide early whether to target them.",
        "Ask mentors what past winners did well — they've seen dozens of events.",
      ]},
      { type: "h2", text: "Make it look real" },
      { type: "p", text: "Design is a shortcut to credibility. A clean UI signals that your team can ship. You don't need to be a designer — a component library and a restrained color palette get you 80% of the way. Avoid default, unstyled forms in your final demo." },
      { type: "h2", text: "Tell a story, not a feature list" },
      { type: "p", text: "The best pitches follow a narrative: meet a person with a problem, watch your product solve it, feel the outcome. Judges remember stories, not bullet points. Give your user a name and walk through their journey live." },
      { type: "quote", text: "Judges score what they remember. A three-minute story lands harder than a three-minute feature tour." },
      { type: "h2", text: "Rehearse the demo until it's boring" },
      { type: "p", text: "A confident, smooth demo signals mastery. Rehearse it enough that you could do it half-asleep — because you might be. Always have a recorded fallback in case the wifi or the live app fails at the worst moment." },
      { type: "h2", text: "Use your mentors" },
      { type: "p", text: "Mentors are an underused advantage. They can unblock you technically, sanity-check your scope, and tell you what judges respond to. Teams that check in with mentors early consistently outperform teams that go heads-down and never surface." },
      { type: "h2", text: "Show what's next" },
      { type: "p", text: "End your pitch with a short, credible roadmap. Judges — especially those thinking about incubation or investment — want to see that your weekend project could become something real. One or two concrete next steps is enough." },
      { type: "h2", text: "Bring it all together at DEVTHON" },
      { type: "p", text: "DEVTHON 2026 rewards exactly these skills — and goes further, connecting standout teams to internships, placements, and startup incubation. Apply these 12 strategies and put them to the test." },
    ],
  },
  {
    slug: "ai-hackathon-project-ideas",
    title: "AI Hackathon Project Ideas: 20 Winning Concepts for 2026",
    description:
      "20 fresh AI and machine learning hackathon project ideas for 2026 across healthcare, education, agriculture, sustainability, and productivity — with tips on scoping them to win.",
    category: "AI & Machine Learning",
    date: "2026-07-14",
    author: "DevUp Ecosystem",
    readingTime: 7,
    keywords: [
      "AI hackathon project ideas",
      "machine learning project ideas",
      "generative AI project ideas",
      "AI hackathon 2026",
      "ML hackathon ideas for students",
      "best AI project ideas",
    ],
    lead: "Stuck on what to build for your next AI hackathon? Here are 20 project ideas across high-impact domains, each scoped so a small team can ship a real demo in 36 hours.",
    body: [
      { type: "h2", text: "HealthTech & accessibility" },
      { type: "ul", items: [
        "An AI symptom-triage assistant that routes users to the right kind of care.",
        "A tool that converts medical reports into plain-language summaries for patients.",
        "A real-time sign-language-to-text translator using computer vision.",
        "A mental-health check-in companion with mood tracking and safe escalation.",
      ]},
      { type: "h2", text: "Education & careers" },
      { type: "ul", items: [
        "A personalized study planner that adapts to a student's weak areas.",
        "An AI mock-interviewer that scores answers and gives feedback.",
        "A tool that turns any PDF or lecture into a quiz and flashcards.",
        "A resume analyzer that maps a student's skills to real job openings.",
      ]},
      { type: "h2", text: "Agriculture & sustainability" },
      { type: "ul", items: [
        "A crop-disease detector from a smartphone photo of a leaf.",
        "An AI advisor that recommends crops based on soil and weather data.",
        "A household carbon-footprint tracker with actionable reduction tips.",
        "A waste-sorting assistant that classifies trash for recycling from a photo.",
      ]},
      { type: "h2", text: "Productivity & developer tools" },
      { type: "ul", items: [
        "An AI agent that turns meeting transcripts into tasks and owners.",
        "A code-review copilot that explains bugs in plain English.",
        "A research assistant that summarizes and cross-references sources with citations.",
        "A natural-language interface for querying a company's internal data.",
      ]},
      { type: "h2", text: "Civic & social impact" },
      { type: "ul", items: [
        "A grievance-routing bot that directs citizen complaints to the right department.",
        "A misinformation checker that flags and explains dubious claims.",
        "An accessibility auditor that scans websites and suggests fixes.",
        "A disaster-response coordinator that matches needs with nearby resources.",
      ]},
      { type: "h2", text: "How to scope any AI idea to win" },
      { type: "p", text: "The idea matters less than the execution. Pick one clear user, one clear task, and make that single flow work end-to-end with a polished interface. Use existing models and APIs rather than training from scratch — judges care that it works and helps someone, not that you built the model yourself." },
      { type: "quote", text: "The winning AI demo is rarely the most technically complex. It's the one where a judge thinks: 'I would actually use this.'" },
      { type: "h2", text: "Build your idea at DEVTHON 2026" },
      { type: "p", text: "DEVTHON's AI & Machine Learning and Generative AI tracks are built for exactly these projects — with mentors, compute, and a path to incubation for the most promising teams. Pick an idea above and make it real." },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function allPostSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

/** Newest first. */
export function sortedPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
