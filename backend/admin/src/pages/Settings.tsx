import { TopBar } from '@/components/Layout/TopBar'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col">
      <TopBar title="Settings" />
      <div className="p-6 space-y-6 max-w-2xl">
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Account</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Email</span>
              <span className="text-sm text-white">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Role</span>
              <span className="text-sm text-indigo-400 font-medium">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Danger Zone</h3>
          <Button variant="danger" onClick={logout}>Sign Out</Button>
        </div>
      </div>
    </div>
  )
}
