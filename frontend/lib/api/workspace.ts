import { api, apiClient } from "./client";

export const PIPELINE_STAGES = [
  "APPLIED",
  "RESUME_SCREENING",
  "SHORTLISTED",
  "HR_ROUND",
  "TECHNICAL_ROUND",
  "ASSIGNMENT",
  "FINAL_INTERVIEW",
  "SELECTED",
  "OFFER_GENERATED",
  "OFFER_ACCEPTED",
  "ONBOARDING",
  "ONBOARDED",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  RESUME_SCREENING: "Resume Screening",
  SHORTLISTED: "Shortlisted",
  HR_ROUND: "HR Round",
  TECHNICAL_ROUND: "Technical Round",
  ASSIGNMENT: "Assignment",
  FINAL_INTERVIEW: "Final Interview",
  SELECTED: "Selected",
  OFFER_GENERATED: "Offer Generated",
  OFFER_ACCEPTED: "Offer Accepted",
  ONBOARDING: "Onboarding",
  ONBOARDED: "Onboarded",
};

/** Stages that a recruiter can move a candidate into directly. */
export const MANUAL_STAGES = PIPELINE_STAGES.filter(
  (s) => !["OFFER_GENERATED", "OFFER_ACCEPTED", "ONBOARDED"].includes(s)
);

export interface Workspace {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  role: string;
}

const w = (code: string, path: string) => `/api/w/${code}${path}`;

export const workspaceApi = {
  myWorkspaces: () => api.get<Workspace[]>("/api/me/workspaces"),

  dashboard: (code: string) => api.get<any>(w(code, "/dashboard")),
  trends: (code: string, months = 6) => api.get<any[]>(w(code, `/analytics/trends?months=${months}`)),
  colleges: (code: string) => api.get<any[]>(w(code, "/analytics/colleges")),

  jobs: (code: string, status?: string) =>
    api.get<any[]>(w(code, `/jobs${status ? `?status=${status}` : ""}`)),
  job: (code: string, id: string) => api.get<any>(w(code, `/jobs/${id}`)),
  createJob: (code: string, body: unknown) => api.post<any>(w(code, "/jobs"), body),
  updateJob: (code: string, id: string, body: unknown) => api.patch<any>(w(code, `/jobs/${id}`), body),
  publishJob: (code: string, id: string) => api.post<any>(w(code, `/jobs/${id}/publish`), {}),
  closeJob: (code: string, id: string, force = false, reason?: string) =>
    api.post<any>(w(code, `/jobs/${id}/close${force ? "?force=true" : ""}`), { reason }),

  applications: (code: string, qs = "") => api.get<any>(w(code, `/applications${qs}`)),
  board: (code: string, jobId?: string) =>
    api.get<any>(w(code, `/applications/board${jobId ? `?jobId=${jobId}` : ""}`)),
  application: (code: string, id: string) => api.get<any>(w(code, `/applications/${id}`)),
  transition: (code: string, id: string, body: { toStage: string; version: number; note?: string }) =>
    api.post<any>(w(code, `/applications/${id}/transition`), body),
  reject: (code: string, id: string, body: { reason: string; version: number }) =>
    api.post<any>(w(code, `/applications/${id}/reject`), body),

  interviews: (code: string) => api.get<any[]>(w(code, "/interviews")),
  scheduleInterview: (code: string, applicationId: string, body: unknown) =>
    api.post<any>(w(code, `/applications/${applicationId}/interviews`), body),
  submitFeedback: (code: string, interviewId: string, body: unknown) =>
    api.post<any>(w(code, `/interviews/${interviewId}/feedback`), body),

  generateOffer: (code: string, applicationId: string, body: unknown) =>
    api.post<any>(w(code, `/applications/${applicationId}/offer`), body),
  revokeOffer: (code: string, offerId: string, reason: string) =>
    api.post<any>(w(code, `/offers/${offerId}/revoke`), { reason }),
  /** Rebuild a document's file when it was issued without one. Number unchanged. */
  regenerateDocument: (code: string, documentId: string) =>
    api.post<any>(w(code, `/documents/${documentId}/regenerate`), {}),
  onboard: (code: string, applicationId: string, body: unknown = {}) =>
    api.post<any>(w(code, `/applications/${applicationId}/onboard`), body),

  employees: (code: string) => api.get<any[]>(w(code, "/employees")),
  interns: (code: string) => api.get<any[]>(w(code, "/interns")),
  documents: (code: string, docType?: string) =>
    api.get<any[]>(w(code, `/documents${docType ? `?docType=${docType}` : ""}`)),

  attendance: (code: string, date: string) => api.get<any>(w(code, `/attendance?date=${date}`)),
  markAttendance: (code: string, body: unknown) => api.post<any>(w(code, "/attendance"), body),
  bulkAttendance: (code: string, body: unknown) => api.post<any>(w(code, "/attendance/bulk"), body),
  employeeAttendance: (code: string, employeeId: string, year: number, month: number) =>
    api.get<any>(w(code, `/attendance/employee/${employeeId}?year=${year}&month=${month}`)),

  reviews: (code: string, employeeId?: string) =>
    api.get<any[]>(w(code, `/performance${employeeId ? `?employeeId=${employeeId}` : ""}`)),
  reviewSummary: (code: string) => api.get<any>(w(code, "/performance/summary")),
  createReview: (code: string, body: unknown) => api.post<any>(w(code, "/performance"), body),
  updateReview: (code: string, id: string, body: unknown) => api.patch<any>(w(code, `/performance/${id}`), body),

  issueDocument: (code: string, body: unknown) => api.post<any>(w(code, "/documents/issue"), body),
  revokeDocument: (code: string, id: string, reason: string) =>
    api.post<any>(w(code, `/documents/${id}/revoke`), { reason }),
  recordExit: (code: string, employeeId: string, body: unknown) =>
    api.post<any>(w(code, `/employees/${employeeId}/exit`), body),

  // ── People ──
  person: (code: string, personId: string) => api.get<any>(w(code, `/team/${personId}`)),
  updatePerson: (code: string, personId: string, body: unknown) =>
    api.patch<any>(w(code, `/team/${personId}`), body),
  deletePerson: (code: string, personId: string, force = false) =>
    api.delete<any>(w(code, `/team/${personId}${force ? "?force=true" : ""}`)),

  // ── Onboarding & direct hires ──
  onboardingQueue: (code: string) => api.get<any[]>(w(code, "/onboarding")),
  onboardingChecklist: (code: string, personId: string) =>
    api.get<any>(w(code, `/onboarding/${personId}`)),
  reviewOnboardingDoc: (code: string, documentId: string, approve: boolean, reason?: string) =>
    api.post<any>(w(code, `/onboarding/documents/${documentId}/review`), { approve, reason }),
  requestOnboardingDocs: (code: string, personId: string) =>
    api.post<any>(w(code, `/onboarding/${personId}/request-documents`), {}),
  uploadOnboardingDoc: (code: string, personId: string, docType: string, file: File) => {
    const fd = new FormData();
    fd.append("docType", docType);
    fd.append("file", file);
    return apiClient<any>(w(code, `/onboarding/${personId}/documents`), { method: "POST", body: fd });
  },
  directHire: (code: string, body: unknown) => api.post<any>(w(code, "/team/direct-hire"), body),
  bulkImport: (code: string, body: unknown) => api.post<any>(w(code, "/team/bulk-import"), body),

  branding: (code: string) => api.get<any>(w(code, "/branding")),
  saveBranding: (code: string, body: unknown) => api.put<any>(w(code, "/branding"), body),
};

export const candidateApi = {
  myApplications: () => api.get<any[]>("/api/me/applications"),
  /** Returns the application for this job, or null if not applied yet. */
  myApplicationForJob: (jobId: string) => api.get<any | null>(`/api/jobs/${jobId}/my-application`),
  myApplication: (id: string) => api.get<any>(`/api/me/applications/${id}`),
  withdraw: (id: string) => api.post<any>(`/api/me/applications/${id}/withdraw`, {}),
  respondToOffer: (id: string, accept: boolean, reason?: string) =>
    api.post<any>(`/api/me/applications/${id}/offer/respond`, { accept, reason }),

  /** A joiner's own onboarding checklists, across every startup they joined. */
  myOnboarding: () => api.get<any[]>("/api/me/onboarding"),
  uploadMyDoc: (personId: string, docType: string, file: File) => {
    const fd = new FormData();
    fd.append("docType", docType);
    fd.append("file", file);
    return apiClient<any>(`/api/me/onboarding/${personId}/documents`, { method: "POST", body: fd });
  },

  /**
   * Their own attendance. Carries no stipend figures by design — what someone
   * is owed lives behind the founder-only finance routes.
   */
  /** Documents issued TO them — offer letter, certificates, ID card. */
  myDocuments: () => api.get<any[]>("/api/me/documents"),
  /** Partner passes awarded to them at events. */
  myTickets: () => api.get<any[]>("/api/me/tickets"),
  myAttendance: () => api.get<any[]>("/api/me/attendance"),
  checkIn: (internId: string) => api.post<any>(`/api/me/attendance/${internId}/check-in`, {}),
  checkOut: (internId: string) => api.post<any>(`/api/me/attendance/${internId}/check-out`, {}),
  /** Their own work updates — slots for a day, and the day summary. */
  myWorkDay: (internId: string, date?: string) =>
    api.get<any>(`/api/me/worklog/${internId}${date ? `?date=${date}` : ""}`),
  fileSlot: (internId: string, body: { slotStart: string; kind: string; summary: string; evidenceUrl?: string }) =>
    api.post<any>(`/api/me/worklog/${internId}/slot`, body),
  fileDaySummary: (internId: string, body: { done: string; blocked?: string; tomorrow?: string }) =>
    api.post<any>(`/api/me/worklog/${internId}/summary`, body),
  myWorkMonth: (internId: string, year: number, month: number) =>
    api.get<any>(`/api/me/worklog/${internId}/month?year=${year}&month=${month}`),

  myAttendanceMonth: (internId: string, year: number, month: number) =>
    api.get<any>(`/api/me/attendance/${internId}/month?year=${year}&month=${month}`),
};

/** Founder-only. Every call here 403s for HR and below. */
/** Founder-only. Who accounted for their time, and who did not. */
export const worklogApi = {
  today: (code: string, date?: string) =>
    api.get<any>(w(code, `/worklog/today${date ? `?date=${date}` : ""}`)),
  month: (code: string, internId: string, year: number, month: number) =>
    api.get<any>(w(code, `/worklog/${internId}/month?year=${year}&month=${month}`)),
  day: (code: string, internId: string, date: string) =>
    api.get<any>(w(code, `/worklog/${internId}/day?date=${date}`)),
  excuse: (code: string, internId: string, body: { slotStart: string; reason: string; summary?: string }) =>
    api.post<any>(w(code, `/worklog/${internId}/excuse`), body),
};

export const financeApi = {
  stipends: (code: string, year: number, month: number) =>
    api.get<any>(`/api/w/${code}/finance/stipends?year=${year}&month=${month}`),
  approve: (code: string, internId: string, year: number, month: number, adjustment?: number, adjustmentNote?: string) =>
    api.post<any>(`/api/w/${code}/finance/stipends/${internId}/approve`, { year, month, adjustment, adjustmentNote }),
  approveMonth: (code: string, year: number, month: number) =>
    api.post<any>(`/api/w/${code}/finance/stipends/approve-month`, { year, month }),
  markPaid: (code: string, payoutId: string, paymentRef?: string) =>
    api.post<any>(`/api/w/${code}/finance/stipends/${payoutId}/paid`, { paymentRef }),
  setStipend: (code: string, internId: string, amount: number) =>
    api.put<any>(`/api/w/${code}/finance/interns/${internId}/stipend`, { amount }),
};

export const internAttendanceApi = {
  roster: (code: string, date?: string) =>
    api.get<any>(`/api/w/${code}/attendance/interns${date ? `?date=${date}` : ""}`),
  month: (code: string, internId: string, year: number, month: number) =>
    api.get<any>(`/api/w/${code}/attendance/interns/${internId}?year=${year}&month=${month}`),
  mark: (code: string, internId: string, date: string, status: string, note?: string) =>
    api.post<any>(`/api/w/${code}/attendance/interns/${internId}/mark`, { date, status, note }),
  setOfficeDays: (code: string, internId: string, officeDays: number[]) =>
    api.put<any>(`/api/w/${code}/attendance/interns/${internId}/office-days`, { officeDays }),
};

export const ONBOARDING_DOC_LABELS: Record<string, string> = {
  AADHAAR: "Aadhaar card",
  PAN: "PAN card",
  PHOTO: "Passport-size photograph",
  COLLEGE_ID: "College ID card",
  MARKSHEET: "Latest marksheet",
  DEGREE_CERTIFICATE: "Degree certificate",
  RESUME: "Updated resume",
  BANK_DETAILS: "Bank details / cancelled cheque",
  ADDRESS_PROOF: "Address proof",
  EXPERIENCE_LETTER_PREV: "Previous experience letter",
  RELIEVING_LETTER_PREV: "Previous relieving letter",
  OTHER: "Other document",
};

export const DOC_STATUS_TONE: Record<string, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: "rgba(255,255,255,0.05)", fg: "#8b8b8b", label: "Not uploaded" },
  SUBMITTED: { bg: "rgba(250,204,21,0.12)", fg: "#facc15", label: "Awaiting review" },
  APPROVED: { bg: "rgba(200,241,53,0.12)", fg: "#c8f135", label: "Approved" },
  REJECTED: { bg: "rgba(248,113,113,0.12)", fg: "#f87171", label: "Rejected" },
};

export const platformApi = {
  overview: () => api.get<any>("/api/admin/analytics/overview"),
  comparison: () => api.get<any[]>("/api/admin/analytics/comparison"),
  funnel: () => api.get<any[]>("/api/admin/analytics/funnel"),
  colleges: () => api.get<any[]>("/api/admin/analytics/colleges"),
  trends: (months = 6) => api.get<any[]>(`/api/admin/analytics/trends?months=${months}`),
};

/** Founder letters across every startup. Platform admins only. */
export const founderApi = {
  list: () => api.get<any[]>("/api/admin/founders"),
  issue: (memberId: string, force = false) =>
    api.post<any>(`/api/admin/founders/${memberId}/letter`, { force }),
  issueMany: (memberIds: string[]) =>
    api.post<any>("/api/admin/founders/letters", { memberIds }),
};

/**
 * Partner desk. Verification is public on purpose — the person checking a
 * ticket is the partner's reception staff, not a DevUp member — while
 * redeeming needs a signed-in partner account.
 */
export const partnerApi = {
  myPartners: () => api.get<any[]>("/api/me/partners"),
  partnerAwards: (partnerId: string) => api.get<any[]>(`/api/me/partners/${partnerId}/awards`),
  redeem: (partnerId: string, code: string) =>
    api.post<any>(`/api/me/partners/${partnerId}/redeem`, { code }),
  verify: (code: string) => api.get<any>(`/api/verify/${encodeURIComponent(code)}`),
};
