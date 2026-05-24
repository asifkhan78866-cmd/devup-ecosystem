import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { AdminLayout } from '@/components/Layout/AdminLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Applications from '@/pages/Applications'
import Startups from '@/pages/Startups'
import UsersPage from '@/pages/Users'
import Jobs from '@/pages/Jobs'
import Hackathons from '@/pages/Hackathons'
import Documents from '@/pages/Documents'
import Cofounders from '@/pages/Cofounders'
import ServiceRequests from '@/pages/ServiceRequests'
import SettingsPage from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="startups" element={<Startups />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="hackathons" element={<Hackathons />} />
            <Route path="documents" element={<Documents />} />
            <Route path="cofounders" element={<Cofounders />} />
            <Route path="services" element={<ServiceRequests />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d0d0d',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </QueryClientProvider>
  )
}
