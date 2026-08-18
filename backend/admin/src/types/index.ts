export interface User {
  id: string
  email: string
  role: 'ADMIN' | 'FOUNDER' | 'STUDENT' | 'INVESTOR'
  isVerified: boolean
  avatarUrl: string | null
  createdAt: string
  profile?: {
    name: string
    bio: string | null
    college: string | null
    city: string | null
    skills: string[]
  }
}

export interface Startup {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  logoUrl: string | null
  bannerUrl: string | null
  website: string | null
  githubUrl: string | null
  screenshotUrls: string[] | null
  domain: string
  stage: string
  type?: 'DEVUP_VENTURE' | 'ECOSYSTEM_PARTNER'
  foundedYear: number
  headcount: string
  location: string
  isVerified: boolean
  isActive: boolean
  isFeatured: boolean
  founderId: string
  createdAt: string
  primaryFounder?: User
  jobs?: Job[]
}

export interface Application {
  id: string
  startupName: string
  domain: string
  oneLiner: string
  website: string | null
  stage: string
  mrr: string | null
  userCount: string | null
  pitchDeckUrl: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMembers: any
  needs: string[]
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'
  submittedBy: string
  reviewedBy: string | null
  reviewNotes: string | null
  createdAt: string
}

export type LeadershipRole =
  | 'STATE_DIRECTOR'
  | 'REGIONAL_DIRECTOR'
  | 'CITY_DIRECTOR'
  | 'CAMPUS_DIRECTOR'

export type LeadershipApplicationStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'SHORTLISTED'
  | 'INTERVIEWING'
  | 'SELECTED'
  | 'REJECTED'

export interface LeadApplication {
  id: string
  applicationNo: string
  role: LeadershipRole
  fullName: string
  email: string
  phone: string
  state: string
  city: string
  college: string
  branch: string | null
  yearOfStudy: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  twitterUrl: string | null
  portfolioUrl: string | null
  whyLead: string
  pastExperience: string | null
  first30DaysPlan: string | null
  status: LeadershipApplicationStatus
  reviewNotes: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  startupId: string
  title: string
  description: string
  type: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'CONTRACT'
  domain: string
  skills: string[]
  location: string
  isRemote: boolean
  stipend: string | null
  salaryRange: string | null
  openings: number
  deadline: string | null
  isActive: boolean
  createdAt: string
  startup?: Startup
  _count?: { applications: number }
}

export interface Hackathon {
  id: string
  title: string
  description: string
  organizer: string
  logoUrl: string | null
  bannerUrl: string | null
  prizePool: string
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  location: string | null
  domain: string[]
  startDate: string
  endDate: string
  registrationDeadline: string
  maxParticipants: number | null
  currentParticipants: number
  isEcosystemHosted: boolean
  isFeatured: boolean
  isActive: boolean
  createdAt: string
}

export interface Document {
  id: string
  startupId: string
  type: 'NDA' | 'EQUITY_AGREEMENT' | 'PARTNERSHIP_TERMS' | 'OTHER'
  name: string
  fileUrl: string
  signedByFounder: boolean
  signedByAdmin: boolean
  founderSignedAt: string | null
  adminSignedAt: string | null
  status: 'PENDING' | 'SIGNED' | 'EXPIRED'
  createdAt: string
  startup?: Startup
}

export interface AuditLog {
  id: string
  adminId: string
  action: string
  entity: string
  entityId: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any
  createdAt: string
}

export interface AdminStats {
  totalUsers: number
  totalStartups: number
  totalApplications: number
  pendingServiceRequests?: number
  totalJobs: number
  activeHackathons: number
  trends: {
    startupsTrend: { value: string; up: boolean }
    applicationsTrend: { value: string; up: boolean }
    usersTrend: { value: string; up: boolean }
  }
  applicationsByDay: Array<{ date: string; submitted: number; approved: number }>
  signupsByWeek: Array<{ week: string; students: number; founders: number }>
  recentActivity: Array<{ text: string; time: string; color: string }>
}

