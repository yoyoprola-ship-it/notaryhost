import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import AdminLayout from './AdminLayout'
import LoginPage from './LoginPage'
import NotariesListPage from './NotariesListPage'
import NotaryFormPage from './NotaryFormPage'
import NotaryDetailPage from './NotaryDetailPage'
import NotaryOperationsPage from './NotaryOperationsPage'
import EnvelopesPage from './EnvelopesPage'
import TwilioSpendPage from './TwilioSpendPage'
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
            <Route path="notaries/:id/operations" element={<NotaryOperationsPage />} />
            <Route path="notaries/:id/edit" element={<NotaryFormPage />} />
            <Route path="envelopes" element={<EnvelopesPage />} />
            <Route path="twilio-spend" element={<TwilioSpendPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  )
}
