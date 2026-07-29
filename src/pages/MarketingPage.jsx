import { useEffect } from 'react'
import Nav from '../components/Nav'
import Hero from '../sections/Hero'
import WhatIBuild from '../sections/WhatIBuild'
import WebsiteFeature from '../sections/WebsiteFeature'
import Confirmations from '../sections/Confirmations'
import IVR from '../sections/IVR'
import Dashboard from '../sections/Dashboard'
import Tech from '../sections/Tech'
import WhoFor from '../sections/WhoFor'
import Included from '../sections/Included'
import Benefits from '../sections/Benefits'
import CaseStudy from '../sections/CaseStudy'
import Directory from '../sections/Directory'
import Pricing from '../sections/Pricing'
import Comparison from '../sections/Comparison'
import Cta from '../sections/Cta'
import Footer from '../sections/Footer'

export default function MarketingPage() {
  useEffect(() => {
    // Empty-body POSTs get rejected upstream with 411 Length Required, so
    // send a tiny real body to guarantee a Content-Length header goes out.
    fetch('/api/site-visits/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => {})
  }, [])

  return (
    <div className="page">
      <Nav />
      <Hero />
      <WhatIBuild />
      <WebsiteFeature />
      <Confirmations />
      <IVR />
      <Dashboard />
      <Tech />
      <WhoFor />
      <Included />
      <Benefits />
      <CaseStudy />
      <Directory />
      <Pricing />
      <Comparison />
      <Cta />
      <Footer />
    </div>
  )
}
