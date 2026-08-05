import { TopBar } from '@/components/Layout/TopBar'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { ApplicationsChart } from '@/components/charts/ApplicationsChart'
import { UsersChart } from '@/components/charts/UsersChart'
import { useAdminStats } from '@/hooks/useAdmin'
import {
  Rocket,
  FileText,
  Users,
  Briefcase,
  Trophy,
  Building2,
  FileCheck,
  Plus,
  Send,
  Upload,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { data: stats, isLoading } = useAdminStats()
  const navigate = useNavigate()

  const statCards = [
    {
      label: 'Active Startups',
      value: stats?.totalStartups ?? '—',
      icon: Rocket,
      trend: stats?.trends?.startupsTrend?.value ?? '',
      trendUp: stats?.trends?.startupsTrend?.up ?? true,
    },
    {
      label: 'Pending Applications',
      value: stats?.totalApplications ?? '—',
      icon: FileText,
      trend: stats?.trends?.applicationsTrend?.value ?? '',
      trendUp: stats?.trends?.applicationsTrend?.up ?? true,
    },
    {
      label: 'Service Requests',
      value: stats?.pendingServiceRequests ?? '—',
      icon: Building2,
      trend: 'Pending requests',
      trendUp: true,
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '—',
      icon: Users,
      trend: stats?.trends?.usersTrend?.value ?? '',
      trendUp: stats?.trends?.usersTrend?.up ?? true,
    },
    { label: 'Active Jobs', value: stats?.totalJobs ?? '—', icon: Briefcase },
    { label: 'Hackathons', value: stats?.activeHackathons ?? '—', icon: Trophy },
  ]

  const activityItems = stats?.recentActivity ?? []

  return (
    <div className="flex flex-col">
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} {...stat} value={isLoading ? '...' : stat.value} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ApplicationsChart data={stats?.applicationsByDay} />
              <UsersChart data={stats?.signupsByWeek} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" size="md" className="justify-start gap-2" onClick={() => navigate('/applications')}>
                <FileCheck className="w-4 h-4 text-indigo-400" /> Review Applications
              </Button>
              <Button variant="outline" size="md" className="justify-start gap-2" onClick={() => navigate('/startups')}>
                <Plus className="w-4 h-4 text-emerald-400" /> Add Startup
              </Button>
              <Button variant="outline" size="md" className="justify-start gap-2" onClick={() => navigate('/hackathons')}>
                <Send className="w-4 h-4 text-purple-400" /> Post Hackathon
              </Button>
              <Button variant="outline" size="md" className="justify-start gap-2" onClick={() => navigate('/documents')}>
                <Upload className="w-4 h-4 text-orange-400" /> Upload Document
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Recent Activity</h3>
            <div className="space-y-4">
              {activityItems.length === 0 ? (
                <p className="text-gray-600 text-sm">No recent activity</p>
              ) : (
                activityItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.color}`} />
                    <div>
                      <p className="text-sm text-white">{item.text}</p>
                      <p className="text-xs text-gray-600">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
