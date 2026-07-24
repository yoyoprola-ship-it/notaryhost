import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import AdminLayout from './AdminLayout'
import LoginPage from './LoginPage'
import NotariesListPage from './NotariesListPage'
import NotaryFormPage from './NotaryFormPage'
import NotaryDetailPage from './NotaryDetailPage'
import UsersListPage from './UsersListPage'
import UserFormPage from './UserFormPage'
import './admin.css'

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<NotariesListPage />} />
            <Route path="notaries/new" element={<NotaryFormPage />} />
            <Route path="notaries/:id" element={<NotaryDetailPage />} />
            <Route path="notaries/:id/edit" element={<NotaryFormPage />} />
            <Route path="users" element={<UsersListPage />} />
            <Route path="users/new" element={<UserFormPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  )
}
