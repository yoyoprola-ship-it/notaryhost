import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MarketingPage from './pages/MarketingPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import { getTenantSlug } from './lib/tenant'
import './App.css'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const TenantMarketingPage = lazy(() => import('./pages/TenantMarketingPage'))
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'))

export default function App() {
  const tenantSlug = getTenantSlug()
  if (tenantSlug) {
    return (
      <Suspense fallback={null}>
        <TenantMarketingPage slug={tenantSlug} />
      </Suspense>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/notaries"
          element={
            <Suspense fallback={null}>
              <DirectoryPage />
            </Suspense>
          }
        />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
