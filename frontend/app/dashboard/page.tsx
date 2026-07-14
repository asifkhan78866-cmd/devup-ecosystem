'use client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { usePermissions, Permissions } from '@/hooks/usePermissions'
import LogoutButton from '@/components/auth/LogoutButton'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Rocket, Briefcase, Trophy, Users, Settings, Bell,
  ChevronRight, Shield, Star, Zap
} from 'lucide-react'
import ProtectedContent from '@/components/auth/ProtectedContent'

export default function DashboardPage() {
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { isAdmin, isFounder, hasPermission } = usePermissions()

  // Removed redirect to let AuthGate handle it
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login')
  //   }
  // }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '2px solid rgba(200,241,53,0.2)',
          borderTopColor: '#c8f135',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!user) {
    return (
      <ProtectedContent blurRadius={12} message="Login to View Dashboard">
        <GuestDashboardPreview isMobile={isMobile} />
      </ProtectedContent>
    )
  }

  const roleLabel: Record<string, string> = {
    STUDENT: 'Student',
    FOUNDER: 'Founder',
    STARTUP_MEMBER: 'Team Member',
    INVESTOR: 'Investor',
    MENTOR: 'Mentor',
    JUDGE: 'Judge',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
  }

  const roleBadgeColor: Record<string, string> = {
    STUDENT: '#3b82f6',
    FOUNDER: '#c8f135',
    STARTUP_MEMBER: '#8b5cf6',
    INVESTOR: '#f59e0b',
    MENTOR: '#10b981',
    JUDGE: '#ec4899',
    ADMIN: '#ef4444',
    SUPER_ADMIN: '#ef4444',
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#0a0a0a',
      paddingTop: 112, paddingBottom: 96,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 20px' : '40px 32px',
      }}>
        
        {/* ─── PROFILE CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
            padding: isMobile ? 24 : 32,
            marginBottom: 32,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: 24,
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c8f135 0%, #4ade80 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#000',
            fontFamily: 'Syne, sans-serif',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={80}
                height={80}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: isMobile ? 28 : 32,
              fontWeight: 800, color: '#ffffff',
              lineHeight: 1.2, marginBottom: 6,
            }}>
              {user.name}
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 14, color: '#6b6b6b',
              marginBottom: 12,
            }}>
              {user.email}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 12px',
                background: `${roleBadgeColor[user.role]}15`,
                border: `1px solid ${roleBadgeColor[user.role]}30`,
                borderRadius: 999,
                fontFamily: 'Inter, sans-serif',
                fontSize: 12, fontWeight: 600,
                color: roleBadgeColor[user.role],
              }}>
                <Shield size={12} />
                {roleLabel[user.role] || user.role}
              </span>
              {user.provider === 'GOOGLE' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 999,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12, color: '#888',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', gap: 8,
            flexDirection: isMobile ? 'row' : 'column',
          }}>
            <Link href="/settings" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              fontFamily: 'Inter, sans-serif',
              fontSize: 13, color: '#a1a1a1',
              textDecoration: 'none',
            }}>
              <Settings size={14} /> Settings
            </Link>
            <LogoutButton variant="button" />
          </div>
        </motion.div>

        {/* ─── QUICK ACTIONS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ marginBottom: 32 }}
        >
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 18, fontWeight: 700,
            color: '#ffffff', marginBottom: 16,
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 12,
          }}>
            {[
              { icon: Trophy, label: 'Hackathons', href: '/hackathons', color: '#f59e0b' },
              { icon: Briefcase, label: 'Careers', href: '/careers', color: '#3b82f6' },
              { icon: Users, label: 'Co-Founders', href: '/cofounders', color: '#8b5cf6' },
              ...(isFounder ? [{ icon: Rocket, label: 'My Startup', href: '/dashboard/startup', color: '#c8f135' }] : []),
              ...(isAdmin ? [{ icon: Shield, label: 'Admin Panel', href: '/admin', color: '#ef4444' }] : []),
              ...(!isFounder && !isAdmin ? [{ icon: Star, label: 'Ecosystem', href: '/ecosystem', color: '#10b981' }] : []),
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px',
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${action.color}40`
                  e.currentTarget.style.background = '#161616'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.background = '#111111'
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${action.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <action.icon size={16} style={{ color: action.color }} />
                </div>
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13, fontWeight: 600,
                  color: '#e4e4e4',
                }}>
                  {action.label}
                </span>
                <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#3d3d3d' }} />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ─── ROLE-BASED DASHBOARD CONTENT ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {user.role === 'FOUNDER' && <FounderDashboard user={user} session={session} isMobile={isMobile} />}
          {user.role === 'STUDENT' && <StudentDashboard user={user} isMobile={isMobile} />}
          {user.role === 'INVESTOR' && <InvestorDashboard user={user} />}
          {(user.role === 'MENTOR' || user.role === 'JUDGE') && <GenericDashboard role={user.role} />}
        </motion.div>
      </div>
    </main>
  )
}

function FounderDashboard({ user, session, isMobile }: { user: any, session: any, isMobile: boolean }) {
  const hasStartup = user.startups && user.startups.length > 0;
  const startup = hasStartup ? user.startups[0] : null;

  const [counts, setCounts] = useState({ roles: 0, applications: 0, documents: 0 });

  useEffect(() => {
    if (!hasStartup || !session?.access_token) return;

    const fetchCounts = async () => {
      try {
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const [jobsRes, appsRes, docsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/jobs?startupId=${startup.id}&limit=100`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/${startup.id}/job-applications`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/startups/${startup.id}/documents`, { headers })
        ]);

        const [jobsData, appsData, docsData] = await Promise.all([
          jobsRes.json(),
          appsRes.json(),
          docsRes.json()
        ]);

        setCounts({
          roles: jobsData.meta?.total || 0,
          applications: appsData.data?.length || 0,
          documents: docsData.data?.length || 0
        });
      } catch (err) {
        console.error('Error fetching dashboard counts', err);
      }
    };

    fetchCounts();
  }, [hasStartup, startup?.id, session?.access_token]);

  const cards = [
    { label: 'Your Startup', value: hasStartup ? startup.name : 'Not set up yet',
      action: hasStartup ? 'Manage profile →' : 'Set up profile →', href: hasStartup ? '/dashboard/startup' : '/dashboard/startup/create' },
    { label: 'Open Roles', value: counts.roles.toString(),
      action: 'Post a role →', href: '/dashboard/startup' },
    { label: 'Applications', value: counts.applications.toString(),
      action: 'View all →', href: '/applications' },
    { label: 'Documents', value: `${counts.documents} signed`,
      action: 'View docs →', href: '/dashboard/documents' },
  ]
  
  return (
    <div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 18, fontWeight: 700,
        color: '#ffffff', marginBottom: 16,
      }}>
        Startup Overview
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: 16, marginBottom: 48,
      }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: 24,
          }}>
            <p style={{
              fontFamily: 'Inter', fontSize: 11,
              color: '#6b6b6b', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 8,
            }}>
              {card.label}
            </p>
            <p style={{
              fontFamily: 'Syne', fontSize: 28,
              fontWeight: 800, color: '#ffffff',
              marginBottom: 12,
            }}>
              {card.value}
            </p>
            <a href={card.href} style={{
              fontFamily: 'Inter', fontSize: 13,
              color: '#c8f135', textDecoration: 'none',
            }}>
              {card.action}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentDashboard({ user, isMobile }: { user: any, isMobile: boolean }) {
  const cards = [
    { label: 'Jobs Applied', value: '0',
      action: 'Browse jobs →', href: '/careers' },
    { label: 'Hackathons', value: '0 registered',
      action: 'Find hackathons →', href: '/hackathons' },
    { label: 'Co-founder Requests', value: '0',
      action: 'View requests →', href: '/cofounders' },
    { label: 'Profile Views', value: '0',
      action: 'Edit profile →', href: '/profile' },
  ]

  return (
    <div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 18, fontWeight: 700,
        color: '#ffffff', marginBottom: 16,
      }}>
        Your Activity
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: 16, marginBottom: 48,
      }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: 24,
          }}>
            <p style={{
              fontFamily: 'Inter', fontSize: 11,
              color: '#6b6b6b', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 8,
            }}>
              {card.label}
            </p>
            <p style={{
              fontFamily: 'Syne', fontSize: 28,
              fontWeight: 800, color: '#ffffff',
              marginBottom: 12,
            }}>
              {card.value}
            </p>
            <a href={card.href} style={{
              fontFamily: 'Inter', fontSize: 13,
              color: '#c8f135', textDecoration: 'none',
            }}>
              {card.action}
            </a>
          </div>
        ))}
      </div>

      {/* Apply as Founder CTA */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(200,241,53,0.05) 0%, rgba(74,222,128,0.05) 100%)',
        border: '1px solid rgba(200,241,53,0.15)',
        borderRadius: 16, padding: isMobile ? 24 : 32,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 20, fontWeight: 700,
            color: '#ffffff', marginBottom: 8,
          }}>
            Ready to build something?
          </h3>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14, color: '#6b6b6b',
          }}>
            Apply to become a Founder to create and manage your startup on DevUp.
          </p>
        </div>
        <Link href="/apply" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px',
          background: '#c8f135', color: '#000',
          borderRadius: 10, fontFamily: 'Inter, sans-serif',
          fontSize: 14, fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}>
          <Zap size={16} /> Apply as Founder
        </Link>
      </div>
    </div>
  )
}

function InvestorDashboard({ user }: { user: any }) {
  return (
    <div style={{
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 40,
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'Syne', fontSize: 20,
        color: '#ffffff', marginBottom: 8,
      }}>
        Investor dashboard coming soon.
      </p>
      <p style={{
        fontFamily: 'Inter', fontSize: 14,
        color: '#6b6b6b',
      }}>
        Browse ecosystem startups while we build this out.
      </p>
      <a href="/ecosystem" style={{
        display: 'inline-block', marginTop: 20,
        padding: '10px 24px',
        background: '#c8f135', color: '#000',
        borderRadius: 10, fontFamily: 'Inter',
        fontSize: 14, fontWeight: 700,
        textDecoration: 'none',
      }}>
        Browse Startups →
      </a>
    </div>
  )
}

function GenericDashboard({ role }: { role: string }) {
  const roleInfo: Record<string, { title: string; desc: string; action: string; href: string }> = {
    MENTOR: {
      title: 'Mentor Dashboard',
      desc: 'Review startups and schedule mentoring sessions.',
      action: 'Browse Startups →',
      href: '/ecosystem',
    },
    JUDGE: {
      title: 'Judge Dashboard',
      desc: 'Evaluate hackathon submissions and provide feedback.',
      action: 'View Hackathons →',
      href: '/hackathons',
    },
  }

  const info = roleInfo[role] || { title: 'Dashboard', desc: 'Welcome to DevUp.', action: 'Explore →', href: '/' }

  return (
    <div style={{
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: 40,
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'Syne', fontSize: 20,
        color: '#ffffff', marginBottom: 8,
      }}>
        {info.title}
      </p>
      <p style={{
        fontFamily: 'Inter', fontSize: 14,
        color: '#6b6b6b',
      }}>
        {info.desc}
      </p>
      <a href={info.href} style={{
        display: 'inline-block', marginTop: 20,
        padding: '10px 24px',
        background: '#c8f135', color: '#000',
        borderRadius: 10, fontFamily: 'Inter',
        fontSize: 14, fontWeight: 700,
        textDecoration: 'none',
      }}>
        {info.action}
      </a>
    </div>
  )
}

function GuestDashboardPreview({ isMobile }: { isMobile: boolean }) {
  return (
    <main style={{
      minHeight: '100vh', background: '#0a0a0a',
      paddingTop: 112, paddingBottom: 96,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 20px' : '40px 32px',
      }}>
        
        {/* Fake Profile Card */}
        <div style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
            padding: isMobile ? 24 : 32,
            marginBottom: 32,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: 24,
          }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c8f135 0%, #4ade80 100%)',
          }} />
          <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ width: 160, height: 32, background: 'rgba(255,255,255,0.1)', borderRadius: 8, marginBottom: 12 }} />
            <div style={{ width: 120, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <div style={{ width: 80, height: 24, background: 'rgba(200,241,53,0.1)', borderRadius: 999 }} />
            </div>
          </div>
        </div>

        {/* Fake Quick Actions */}
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 18, fontWeight: 700,
          color: '#ffffff', marginBottom: 16,
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 32,
        }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              height: 60,
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
            }} />
          ))}
        </div>

        {/* Fake Dashboard Content */}
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 18, fontWeight: 700,
          color: '#ffffff', marginBottom: 16,
        }}>
          Your Activity
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: 16,
        }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              height: 120,
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
            }} />
          ))}
        </div>
      </div>
    </main>
  )
}
