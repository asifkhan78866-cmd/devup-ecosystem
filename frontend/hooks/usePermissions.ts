import { useAuth, type UserRole } from '@/lib/auth/AuthProvider'

// Mirror of the backend permission constants
export const Permissions = {
  VIEW_PUBLIC: 'view:public',
  APPLY_HACKATHON: 'apply:hackathon',
  EVALUATE_HACKATHON: 'evaluate:hackathon',
  MANAGE_HACKATHONS: 'manage:hackathons',
  BROWSE_STARTUPS: 'browse:startups',
  CREATE_STARTUP: 'create:startup',
  MANAGE_STARTUP: 'manage:startup',
  MANAGE_OWN_STARTUP: 'manage:own_startup',
  VIEW_VERIFIED_STARTUPS: 'view:verified_startups',
  CONTACT_FOUNDERS: 'contact:founders',
  REVIEW_STARTUPS: 'review:startups',
  BROWSE_FOUNDERS: 'browse:founders',
  INVITE_MEMBERS: 'invite:members',
  POST_JOBS: 'post:jobs',
  MANAGE_USERS: 'manage:users',
  APPROVE_FOUNDERS: 'approve:founders',
  APPROVE_STARTUPS: 'approve:startups',
  SCHEDULE_MEETINGS: 'schedule:meetings',
  ADMIN_PANEL: 'access:admin',
  SUPER_ADMIN: 'access:super_admin',
} as const

type Permission = (typeof Permissions)[keyof typeof Permissions]

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: [
    Permissions.VIEW_PUBLIC,
    Permissions.APPLY_HACKATHON,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
  ],
  FOUNDER: [
    Permissions.VIEW_PUBLIC,
    Permissions.APPLY_HACKATHON,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.CREATE_STARTUP,
    Permissions.MANAGE_STARTUP,
    Permissions.INVITE_MEMBERS,
    Permissions.POST_JOBS,
    Permissions.CONTACT_FOUNDERS,
  ],
  STARTUP_MEMBER: [
    Permissions.VIEW_PUBLIC,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.MANAGE_OWN_STARTUP,
  ],
  MENTOR: [
    Permissions.VIEW_PUBLIC,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.REVIEW_STARTUPS,
    Permissions.SCHEDULE_MEETINGS,
  ],
  JUDGE: [
    Permissions.VIEW_PUBLIC,
    Permissions.BROWSE_STARTUPS,
    Permissions.EVALUATE_HACKATHON,
  ],
  INVESTOR: [
    Permissions.VIEW_PUBLIC,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.VIEW_VERIFIED_STARTUPS,
    Permissions.CONTACT_FOUNDERS,
  ],
  ADMIN: [
    Permissions.VIEW_PUBLIC,
    Permissions.APPLY_HACKATHON,
    Permissions.BROWSE_STARTUPS,
    Permissions.BROWSE_FOUNDERS,
    Permissions.CREATE_STARTUP,
    Permissions.MANAGE_STARTUP,
    Permissions.MANAGE_OWN_STARTUP,
    Permissions.INVITE_MEMBERS,
    Permissions.POST_JOBS,
    Permissions.CONTACT_FOUNDERS,
    Permissions.REVIEW_STARTUPS,
    Permissions.EVALUATE_HACKATHON,
    Permissions.MANAGE_HACKATHONS,
    Permissions.MANAGE_USERS,
    Permissions.APPROVE_FOUNDERS,
    Permissions.APPROVE_STARTUPS,
    Permissions.SCHEDULE_MEETINGS,
    Permissions.VIEW_VERIFIED_STARTUPS,
    Permissions.ADMIN_PANEL,
  ],
  SUPER_ADMIN: Object.values(Permissions),
}

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    const perms = ROLE_PERMISSIONS[user.role]
    return perms?.includes(permission) ?? false
  }

  const hasAnyPermission = (...permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p))
  }

  const hasAllPermissions = (...permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p))
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isFounder = user?.role === 'FOUNDER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isFounder,
    isSuperAdmin,
    role: user?.role ?? null,
    permissions: user ? ROLE_PERMISSIONS[user.role] || [] : [],
  }
}
