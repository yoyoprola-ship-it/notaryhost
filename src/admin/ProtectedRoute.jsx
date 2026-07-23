import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { isAdminSession } from './session'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!isAdminSession(user)) return <Navigate to="/admin/login" replace />

  return <Outlet />
}
