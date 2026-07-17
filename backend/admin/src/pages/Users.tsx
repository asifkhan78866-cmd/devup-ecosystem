import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/api'
import { TopBar } from '@/components/Layout/TopBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { User } from '@/types'
import { X, Trash2, Activity } from 'lucide-react'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/api/users?limit=100')
      return res.data
    },
  })

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['userActivity', selectedUser?.id],
    queryFn: async () => {
      const res = await api.get(`/api/users/${selectedUser?.id}/activity`)
      return res.data
    },
    enabled: !!selectedUser,
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/users/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  })

  const users: User[] = data?.data || []
  const activities = activityData?.data || []

  return (
    <div className="flex flex-col relative h-full">
      <TopBar title="Users" />
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <Badge label={`${users.length} users`} />

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-gray-500">No users found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Verified</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{u.profile?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{u.email}</td>
                    <td className="px-6 py-4"><Badge label={u.role} /></td>
                    <td className="px-6 py-4">
                      <span className={`w-2 h-2 rounded-full inline-block ${u.isVerified ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUser(u)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-over Panel for User Details */}
      {selectedUser && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-md h-full bg-[#111] border-l border-white/10 flex flex-col animate-in slide-in-from-right">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Profile Summary */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedUser.profile?.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge label={selectedUser.role} />
                    {selectedUser.isVerified && <Badge label="Verified" className="bg-emerald-500/10 text-emerald-400" />}
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={18} className="text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Recent Activity</h4>
                </div>
                
                {activityLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />)}
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((act: any, i: number) => (
                      <div key={i} className="relative pl-4 border-l-2 border-white/10 py-1">
                        <div className="absolute w-2 h-2 bg-indigo-500 rounded-full -left-[5px] top-2" />
                        <p className="text-sm text-white font-medium">{act.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-4">No recent activity found.</div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="pt-8 border-t border-red-500/10">
                <h4 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">Danger Zone</h4>
                <p className="text-xs text-gray-400 mb-4">Deleting this user will permanently remove their profile, applications, and registrations. It will be blocked if they are the primary founder of a startup.</p>
                <Button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to permanently delete ${selectedUser.email}?`)) {
                      deleteMutation.mutate(selectedUser.id)
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                >
                  <Trash2 size={16} className="mr-2" />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
