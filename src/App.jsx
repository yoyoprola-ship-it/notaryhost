import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MarketingPage from './pages/MarketingPage'
import { getTenantSlug } from './lib/tenant'
import './App.css'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const TenantMarketingPage = lazy(() => import('./pages/TenantMarketingPage'))

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
