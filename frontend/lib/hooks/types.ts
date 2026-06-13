export type Startup = {
  id: string;
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  domain?: string;
  stage?: string;
  location?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isFeatured?: boolean;
  isVerified?: boolean;
};

export type Job = {
  id: string;
  startupId: string;
  title: string;
  description?: string;
  type?: string;
  domain?: string;
  location?: string;
  isRemote?: boolean;
  stipend?: string | null;
  salaryRange?: string | null;
};

export type Hackathon = {
  id: string;
  title: string;
  description?: string;
  mode?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  prizePool?: string | null;
};

export type CofounderProfile = {
  id: string;
  userId: string;
  role?: string;
  stage?: string;
  bio?: string | null;
  skills?: string[];
  isActive?: boolean;
};

export type PaginatedResponse<T> = {
  data?: T[];
  startups?: T[];
  jobs?: T[];
  hackathons?: T[];
  profiles?: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages: number;
};
