import { TopBar } from '@/components/Layout/TopBar'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { useAdminStats } from '@/hooks/useAdmin'
import {
  Rocket,
  FileText,
  Users,
  Briefcase,
  Trophy,
  Shield,
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
    { label: 'Active Startups', value: stats?.totalStartups ?? '—', icon: Rocket, trend: '12% this week', trendUp: true },
    { label: 'Pending Applications', value: stats?.totalApplications ?? '—', icon: FileText, trend: '3 new today', trendUp: true },
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, trend: '8% this month', trendUp: true },
    { label: 'Active Jobs', value: stats?.totalJobs ?? '—', icon: Briefcase },
    { label: 'Hackathons', value: stats?.activeHackathons ?? '—', icon: Trophy },
    { label: 'Documents', value: '—', icon: Shield },
  ]

  const activityItems = [
    { text: 'New application from NexusAI', time: '2 min ago', color: 'bg-indigo-500' },
    { text: 'Asif signed NDA document', time: '15 min ago', color: 'bg-emerald-500' },
    { text: '3 new users registered', time: '1 hr ago', color: 'bg-blue-500' },
    { text: 'CloudForge job posting went live', time: '2 hrs ago', color: 'bg-purple-500' },
    { text: 'Hackathon registration opened', time: '3 hrs ago', color: 'bg-orange-500' },
  ]

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
          {/* Charts placeholder */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Applications Overview</h3>
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                Connect backend to see live charts
              </div>
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
              {activityItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.color}`} />
                  <div>
                    <p className="text-sm text-white">{item.text}</p>
                    <p className="text-xs text-gray-600">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
