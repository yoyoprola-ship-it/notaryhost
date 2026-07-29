import { Component, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MarketingPage from './pages/MarketingPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import { getTenantSlug } from './lib/tenant'
import './App.css'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const TenantMarketingPage = lazy(() => import('./pages/TenantMarketingPage'))
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'))

// A blank fallback leaves the page fully white with zero feedback while the
// chunk (and the Firebase SDK it pulls in) downloads — slow on a bad
// connection, and easy to mistake for the page being broken.
function RouteLoading() {
  return <div className="route-loading">Loading…</div>
}

const CHUNK_RELOAD_KEY = 'chunk-reload-attempted'

// After a deploy, a browser that already had the site open can still be
// holding a reference to a JS chunk hash that no longer exists on the
// server — the dynamic import() rejects, React unmounts to a blank screen,
// and nothing short of a manual refresh fetches the new index.html that
// points at the current hashes. This catches exactly that and reloads once
// automatically instead of leaving the visitor staring at a blank page.
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    const isChunkError = /dynamically imported module|module script failed|Failed to fetch/i.test(
      error?.message || ''
    )
    if (isChunkError && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        return <div className="route-loading">Loading…</div>
      }
      return (
        <div className="route-loading">
          <div>
            Something went wrong loading this page.{' '}
            <a href={window.location.href}>Reload</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const tenantSlug = getTenantSlug()
  if (tenantSlug) {
    return (
      <ChunkErrorBoundary>
        <Suspense fallback={<RouteLoading />}>
          <TenantMarketingPage slug={tenantSlug} />
        </Suspense>
      </ChunkErrorBoundary>
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
            <ChunkErrorBoundary>
              <Suspense fallback={<RouteLoading />}>
                <DirectoryPage />
              </Suspense>
            </ChunkErrorBoundary>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ChunkErrorBoundary>
              <Suspense fallback={<RouteLoading />}>
                <AdminApp />
              </Suspense>
            </ChunkErrorBoundary>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
