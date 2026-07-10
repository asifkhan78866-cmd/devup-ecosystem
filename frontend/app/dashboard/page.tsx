'use client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

export default function DashboardPage() {
  const { user, session, loading, signOut } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="p-6 md:p-8 pt-28 md:pt-32 max-w-6xl mx-auto min-h-screen pb-24" style={{
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

  if (!user) return null

  return (
    <main style={{
      minHeight: '100vh', background: '#0a0a0a',
      paddingTop: 112, paddingBottom: 96,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 20px' : '40px 32px',
      }}>
        
        {/* Welcome header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{
            fontFamily: 'Inter', fontSize: 11,
            color: '#c8f135', textTransform: 'uppercase',
            letterSpacing: '0.12em', marginBottom: 8,
          }}>
            ✦ {user.role}
          </p>
          <h1 style={{
            fontFamily: 'Syne', fontSize: 40,
            fontWeight: 800, color: '#ffffff',
            lineHeight: 1.1,
          }}>
            Welcome back,<br />
            <span style={{ color: '#c8f135' }}>
              {user.name.split(' ')[0]}.
            </span>
          </h1>
        </div>

        {/* Role-based dashboard content */}
        {user.role === 'FOUNDER' && <FounderDashboard user={user} session={session} isMobile={isMobile} />}
        {user.role === 'STUDENT' && <StudentDashboard user={user} isMobile={isMobile} />}
        {user.role === 'INVESTOR' && <InvestorDashboard user={user} />}
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
