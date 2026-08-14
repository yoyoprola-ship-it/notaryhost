import { Outlet } from 'react-router-dom'
import AdminNav from './AdminNav'

export default function AdminLayout() {
  return (
    <div className="admin-app">
      <AdminNav />
      <Outlet />
    </div>
  )
}
